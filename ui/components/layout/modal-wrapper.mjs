import { useState, useEffect, useContext } from 'react'
import { ModalContext } from 'context/modal.mjs'
import { CloseIcon } from 'components/icons.mjs'

const slideClasses = {
  left: '-translate-x-full',
  right: 'translate-x-full',
  top: '-translate-y-full',
  bottom: 'translate-y-full',
}

export const ModalWrapper = ({
  children = null,
  flex = 'row',
  justify = 'center',
  items = 'center',
  bg = 'base-100 lg:bg-base-300',
  bgOpacity = '50 lg:bg-opacity-50',
  bare = false,
  keepOpenOnClick = false,
  slideFrom = 'left',
  fullWidth = false,
  wClass = 'max-w-2xl w-full',
}) => {
  const { popModal, stackCount } = useContext(ModalContext)
  const [animate, setAnimate] = useState('in')

  const close = (evt) => {
    // Only process the first event
    if (evt?.event) evt.event.stopPropagation()
    if (stackCount < 2) {
      setAnimate('out')
      window.setTimeout(popModal, 150)
    } else popModal()
  }

  useEffect(() => {
    // only turn off animation if it's animating in
    if (animate === 'in') setAnimate(false)
  }, [animate])

  // CSS classes for animation
  const animation = animate
    ? `lg:opacity-0 ${slideClasses[slideFrom]} lg:translate-x-0 lg:translate-y-0`
    : 'opacity-100 translate-none'

  const stopClick = (evt) => evt.stopPropagation()

  return (
    <div
      className={`fixed top-0 left-0 m-0 p-0 shadow w-full h-screen backdrop-blur-sm
        transform-all duration-150 ${animation}
        bg-${bg} bg-opacity-${bgOpacity} z-40 hover:cursor-pointer
        flex flex-${flex} justify-${justify} items-${items} lg:p-12`}
      onClick={close}
    >
      {bare ? (
        children
      ) : (
        <div
          onClick={keepOpenOnClick ? stopClick : null}
          className={`z-30 bg-base-100 p-4 lg:px-8 lg:rounded-lg lg:shadow-lg max-h-full overflow-auto hover:cursor-default ${
            fullWidth ? 'w-full' : wClass
          }`}
        >
          {children}
          <button
            className="fixed bottom-2 right-2 btn btn-neutral btn-circle lg:hidden"
            onClick={close}
          >
            <CloseIcon className="w-8 h-8" />
          </button>
        </div>
      )}
    </div>
  )
}
