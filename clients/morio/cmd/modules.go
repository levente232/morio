package cmd

import (
	"fmt"
	"github.com/spf13/cobra"
	"os"
	"path/filepath"
	"sort"
	"strings"
)

// morio modules
var modulesCmd = &cobra.Command{
	Use:   "modules",
	Short: "Manage modules",
	Long: `Manages client modules.
This allows you to manage Morio client modules which will be applied to all agents.`,
}

// morio modules list
var modulesListCmd = &cobra.Command{
	Use:   "list",
	Short: "List modules",
	Long:  `List client modules.`,
	Run: func(cmd *cobra.Command, args []string) {
		ShowModulesList()
	},
}

// morio modules enable
var modulesEnableCmd = &cobra.Command{
	Use:   "enable [module-name]",
	Short: "Enable a module",
	Long:  `Enables a client module.`,
	Args:  cobra.ExactArgs(1),
	Run: func(cmd *cobra.Command, args []string) {
		enableModule(args[0])
		ShowModulesList()
	},
}

// morio modules disable
var modulesDisableCmd = &cobra.Command{
	Use:   "disable [module-name]",
	Short: "Disable a module",
	Long:  `Disables a client module.`,
	Args:  cobra.ExactArgs(1),
	Run: func(cmd *cobra.Command, args []string) {
		disableModule(args[0])
		ShowModulesList()
	},
}

// morio modules info
var modulesInfoCmd = &cobra.Command{
	Use:     "info [module-name]",
	Short:   "Show module info",
	Long:    `Shows info about a client module.`,
	Args:    cobra.ExactArgs(1),
	Example: `  morio module info linux-system`,
	Run: func(cmd *cobra.Command, args []string) {
		ModuleInfo(args[0])
	},
}

func init() {
	// Add the commands
	RootCmd.AddCommand(modulesCmd)
	modulesCmd.AddCommand(modulesListCmd)
	modulesCmd.AddCommand(modulesEnableCmd)
	modulesCmd.AddCommand(modulesDisableCmd)
	modulesCmd.AddCommand(modulesInfoCmd)
}

func ShowModuleList(agent string) {
	enabled, disabled := ModuleList(agent + "/module-templates.d")
	if agent == "logs" {
		enabledInputs, disabledInputs := ModuleList(agent + "/input-templates.d")
		enabled = joinUnique(enabled, enabledInputs)
		disabled = joinUnique(disabled, disabledInputs)
	}
	if len(enabled) == 0 {
		fmt.Println("No " + agent + " modules enabled")
	} else {
		fmt.Println("Enabled " + agent + " modules:")
		for _, name := range enabled {
			fmt.Println(" - " + ModuleNameFromFile(name))
		}
	}
	if len(disabled) == 0 {
		fmt.Println("No " + agent + " modules disabled")
	} else {
		fmt.Println("Disabled " + agent + " modules:")
		for _, name := range disabled {
			fmt.Println(" - " + ModuleNameFromFile(name))
		}
	}
	fmt.Println()
}

func ShowModulesList() {
	ShowModuleList("audit")
	ShowModuleList("logs")
	ShowModuleList("metrics")
}

func ModuleList(folder string) ([]string, []string) {
	var enabled []string
	var disabled []string
	path := GetConfigPath(folder)
	templates, err := os.ReadDir(path)
	if err != nil {
		fmt.Println("Unable to load template list from " + path)
		panic(err)
	}

	for _, template := range templates {
		suffix := filepath.Ext(template.Name())
		if !template.IsDir() {
			if suffix == ".yml" {
				enabled = append(enabled, template.Name())
			}
			if suffix == ".disabled" {
				disabled = append(disabled, template.Name())
			}
		}
	}

	return enabled, disabled
}

func enableModule(module string) {
	enableAuditModule(module)
	enableLogsModule(module)
	enableMetricsModule(module)
}

func enableAuditModule(module string) {
	enableModuleFile("audit/module-templates.d", module)
}

func enableLogsModule(module string) {
	enableModuleFile("logs/input-templates.d", module)
	enableModuleFile("logs/module-templates.d", module)
}

func enableMetricsModule(module string) {
	enableModuleFile("metrics/module-templates.d", module)
}

func enableModuleFile(base, module string) {
	_, disabled := ModuleList(base)
	for _, name := range disabled {
		moduleName := ModuleNameFromFile(name)
		if moduleName == module {
			os.Rename(GetConfigPath(base+"/"+name), GetConfigPath(base+"/"+moduleName+".yml"))
		}
	}
}

func disableModule(module string) {
	disableAuditModule(module)
	disableLogsModule(module)
	disableMetricsModule(module)
}

func disableAuditModule(module string) {
	disableModuleFile("audit/module-templates.d", module)
}

func disableLogsModule(module string) {
	disableModuleFile("logs/input-templates.d", module)
	disableModuleFile("logs/module-templates.d", module)
}

func disableMetricsModule(module string) {
	disableModuleFile("metrics/module-templates.d", module)
}

func disableModuleFile(base, module string) {
	enabled, _ := ModuleList(base)
	for _, name := range enabled {
		moduleName := ModuleNameFromFile(name)
		if moduleName == module {
			os.Rename(GetConfigPath(base+"/"+moduleName+".yml"), GetConfigPath(base+"/"+moduleName+".yml.disabled"))
		}
	}
}

func ModuleNameFromFile(file string) string {
	baseFile := filepath.Base(file)
	base := baseFile[:len(baseFile)-len(filepath.Ext(baseFile))]
	// Disabled modules have a double extension
	if strings.HasSuffix(base, ".yml") {
		return base[:len(base)-len(filepath.Ext(base))]
	} else {
		return base
	}
}

func ModuleInfo(module string) {
	AuditModuleInfo(module, true)
	LogsModuleInfo(module, false)
	MetricsModuleInfo(module, false)
}

func AuditModuleInfo(module string, printHeader bool) {
	ModuleFileInfo("audit", "module-templates.d", module, printHeader)
}

func LogsModuleInfo(module string, printHeader bool) {
	ModuleFileInfo("logs", "module-templates.d", module, printHeader)
	ModuleFileInfo("logs", "input-templates.d", module, false)
}

func MetricsModuleInfo(module string, printHeader bool) {
	ModuleFileInfo("metrics", "module-templates.d", module, printHeader)
}

func ModuleFileInfo(agent, folder, module string, printHeader bool) {
	enabled, disabled := ModuleList(agent + "/" + folder)
	for _, name := range enabled {
		moduleName := ModuleNameFromFile(name)
		if moduleName == module {
			if printHeader == true {
				PrintModuleInfoHeader(module, "enabled")
			}
			PrintModuleInfoData(agent, folder, name)
		}
	}
	for _, name := range disabled {
		moduleName := ModuleNameFromFile(name)
		if moduleName == module {
			if printHeader == true {
				PrintModuleInfoHeader(module, "disabled")
			}
			PrintModuleInfoData(agent, folder, name)
		}
	}
}

func PrintModuleInfoHeader(module, status string) {
	fmt.Print()
	fmt.Println("Module: " + module)
	fmt.Println("Status: " + status)
	fmt.Print()
}

func PrintModuleInfoData(agent, folder, file string) {
	moriodata := TemplateDocsAsYaml(agent + "/" + folder + "/" + file)

	// We want this in alphabetical order
	sorted := make([]string, 0, len(moriodata))
	for k := range moriodata {
		sorted = append(sorted, k)
	}
	sort.Strings(sorted)

	if len(moriodata) > 0 {
		fmt.Print("  [ " + agent + " ]")
	}
	for _, key := range sorted {
		val := moriodata[key]
		if key == "href" {
			fmt.Print("\n    See: ")
			fmt.Print(val)
		}
		if key == "info" {
			fmt.Print("\n    Info: ")
			fmt.Print(val)
		}
		if key == "version" {
			fmt.Print("\n    Version: ")
			fmt.Println(val)
		}
		if key == "vars" {
			fmt.Print("\n    Vars:")
			vars, ok := moriodata["vars"].(map[string]interface{})
			if ok {
				for varKey, _ := range vars {
					fmt.Print("\n      " + varKey + ": ")
					nested, ok := vars[varKey].(map[string]interface{})
					if ok {
						if docs, ok := nested["info"].(string); ok {
							if ok {
								fmt.Print(docs)
							}
						}
					}
				}
			}
		}
	}
}

func joinUnique(slice1, slice2 []string) []string {
	uniqueMap := make(map[string]bool)
	for _, item := range slice1 {
		uniqueMap[item] = true
	}
	for _, item := range slice2 {
		uniqueMap[item] = true
	}
	result := make([]string, 0, len(uniqueMap))
	for key := range uniqueMap {
		result = append(result, key)
	}

	return result
}
