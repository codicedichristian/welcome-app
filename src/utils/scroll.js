export const getScrollY = () =>
  window.scrollY ||
  document.documentElement.scrollTop ||
  document.body.scrollTop ||
  0

export const setScrollY = (y) => {
  window.scrollTo({ top: y, behavior: 'instant' })
  document.documentElement.scrollTop = y
  document.body.scrollTop = y
}
