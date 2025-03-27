/**
 * Utility function to combine multiple CSS Module classes
 * @param {...string} classes - CSS Module class names to combine
 * @returns {string} - Combined class names
 */
export const cx = (...classes) => {
  return classes.filter(Boolean).join(' ');
};

/**
 * Utility function to apply a conditional class
 * @param {string} baseClass - Base CSS Module class
 * @param {Object} conditionalClasses - Object with class names as keys and conditions as values
 * @returns {string} - Combined class names
 */
export const classNames = (baseClass, conditionalClasses = {}) => {
  const classes = [baseClass];
  
  Object.entries(conditionalClasses).forEach(([className, condition]) => {
    if (condition) {
      classes.push(className);
    }
  });
  
  return classes.join(' ');
};
