export default (a, b) => {
  if (a._id && b._id) {
    return b._id - a._id;
  } else if (a._id) {
    return 1;
  } else if (b._id) {
    return -1;
  } else {
    return a.id - b.id;
  }
};
