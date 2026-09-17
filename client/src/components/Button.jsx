import styles from './Button.module.css'

// variant: primary (one per screen), secondary, ghost, danger. size: regular, small.
// Pass `as={Link}` to render a link that looks like a button.
export default function Button({ as: Component = 'button', variant = 'primary', size = 'regular', className = '', ...props }) {
  const classes = [styles.button, styles[variant], size === 'small' ? styles.small : '', className]
    .filter(Boolean)
    .join(' ')
  const typeProps = Component === 'button' ? { type: 'button' } : {}
  return <Component {...typeProps} {...props} className={classes} />
}
