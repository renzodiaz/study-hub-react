const normalizeOne = (item) => {
  const { id, attributes } = item;
  const result = { id, ...attributes };

  for (const key of Object.keys(result)) {
    const val = result[key];
    if (Array.isArray(val) && val[0]?.attributes) {
      result[key] = val.map(normalizeOne);
    } else if (
      val &&
      typeof val === 'object' &&
      !Array.isArray(val) &&
      val.attributes
    ) {
      result[key] = normalizeOne(val);
    }
  }

  return result;
};

export const normalize = ({ data }) =>
  Array.isArray(data) ? data.map(normalizeOne) : normalizeOne(data);
