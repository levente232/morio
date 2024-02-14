import Joi from 'joi'
import { Popout } from 'components/popout.mjs'
import { slugify } from 'lib/utils.mjs'

/*
 * Meta data
 *
 * This holds the configuration wizard view settings for metadata
 */
export const meta = () => ({
  about: `This is metadata that helps telling different configurations apart.`,
  title: 'Metadata',
  type: 'info',
  children: {
    comment: {
      type: 'form',
      title: 'Comment',
      form: [
        'Think of a comment as a commit message. Mention what was changed, and why you made the changes.',
        {
          schema: Joi.string().required(),
          label: 'Comment',
          placeholder: `Write your comment here`,
          textarea: true,
          key: 'msg',
        },
      ],
    },
  },
})
