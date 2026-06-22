const classNames = (...classes) => {
  return classes.filter(Boolean).join(' ');
};

const slugify = (str) =>
  str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-');

export { classNames, slugify };
