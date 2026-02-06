function calculateQuantity(items) {
  return Object.values(
    items.reduce((acc, item) => {
      if (!acc[item.stuff_id]) {
        acc[item.stuff_id] = { stuff_id: item.stuff_id, quantity: 0 };
      }
      acc[item.stuff_id].quantity += 1;
      return acc;
    }, {}),
  );
}

export default calculateQuantity;
