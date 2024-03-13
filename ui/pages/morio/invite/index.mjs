import { useState } from 'react'
import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { ContentWrapper } from 'components/layout/content-wrapper.mjs'
import { MorioIcon } from 'components/icons.mjs'
import { ActivateAccount } from 'components/accounts/index.mjs'

const MorioInvitePage = (props) => {
  const [invite, setInvite] = useState('')

  return (
    <PageWrapper {...props} role={false}>
      <ContentWrapper {...props} Icon={MorioIcon} title={props.title}>
        <div className="max-w-2xl">
          <ActivateAccount />
        </div>
      </ContentWrapper>
    </PageWrapper>
  )
}

export default MorioInvitePage

export const getStaticProps = () => ({
  props: {
    title: 'Activate a Morio Invite',
    page: ['morio', 'invite'],
  },
})
