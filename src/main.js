/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {
  const { discount, sale_price, quantity } = purchase;

  return sale_price * quantity * (1 - discount / 100);
}

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) {
  const { profit } = seller;

  if (!seller || index < 0 || total < 0) {
    throw new Error("Некорректные входные данные");
  }

  if (index === 0) {
    return profit * 0.15;
  } else if (index === 1) {
    return profit * 0.1;
  } else if (index === total - 1) {
    return 0;
  } else {
    return profit * 0.05;
  }
}

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
function analyzeSalesData(data, options) {
  const { calculateRevenue, calculateBonus } = options;

  if (!data || !options) {
    throw new Error("Некорректные входные данные");
  }

  const salesData = [];

  const sellers = Object.values(data.sellers);

  const products = Object.values(data.products);

  const recordsBySeller = groupBy(
    data.purchase_records,
    (item) => item.seller_id
  );

  sellers.forEach((seller) => {
    const sellerData = {};

    sellerData.id = seller.id;
    sellerData.name = `${seller.first_name} ${seller.last_name}`;
    sellerData["revenue"] = 0;
    sellerData["profit"] = 0;
    sellerData["sales_count"] = 0;
    salesData.push(sellerData);

    let totalRev = 0;
    let totalCost = 0;
    let totalCount = 0;
    let productStat = [];
    let products_sold = {};

    let totalSales = recordsBySeller[`${seller.id}`].flatMap(
      (item) => item.items
    );

    totalSales.forEach((sale) => {
      totalRev += calculateRevenue(sale);
      totalCost += calculateTotalPurchasePrice(sale, products);
      totalCount += sale.quantity;
      productStat = getProductStats(sale, products_sold);
    });

    productStat = Object.entries(products_sold).map(([k, v]) => {
      let sku = {};
      sku.sku = k;
      sku.quantity = v;
      return sku;
    });
    productStat.sort((item1, item2) => item2.quantity - item1.quantity);
    productStat = productStat.slice(0, 10);

    sellerData.revenue = totalRev.toFixed(2);
    sellerData.profit = (totalRev - totalCost).toFixed(2);
    sellerData.sales_count = totalCount;
    sellerData["top_products"] = productStat;
  });

  sortedSaleData = salesData.sort(
    (seller1, seller2) => seller2.profit - seller1.profit
  );

  for (let i = 0; i < sortedSaleData.length; i++) {
    sortedSaleData[i]["bonus"] = calculateBonus(
      i,
      sortedSaleData.length,
      sortedSaleData[i]
    ).toFixed(2);
  }

  return sortedSaleData;
}

/**
 *
 * @param array - массив данных для сортировки
 * @param groupFunc - функция для определения параметра сортировки
 * @returns - массив с группированными данными
 */
function groupBy(array, groupFunc) {
  return array.reduce((result, item) => {
    const key = groupFunc(item);
    if (!result[key]) {
      result[key] = [];
    } else {
      result[key].push(item);
    }
    return result;
  }, {});
}

/**
 *
 * @param purchase - данные о сделке
 * @param {*} products - массив со всеми товарами
 * @returns - общую себестоимость
 */
function calculateTotalPurchasePrice(purchase, products) {
  const { sku, quantity } = purchase;

  let product = products.find((item) => item.sku === sku);

  return product.purchase_price * quantity;
}

function getProductStats(sale, products_sold) {
  if (products_sold[`${sale.sku}`] == null) {
    let sku = {};
    products_sold[`${sale.sku}`] = 1;
  } else {
    products_sold[`${sale.sku}`] += 1;
  }

  return products_sold;
}

// function calculateRevenue(salesData, options) {
//   const { calculateRevenue } = options;

//   salesData.forEach((seller) => {
//     let totalRev = 0;
//     seller.products_sold.forEach((sale) => {
//       totalRev += calculateRevenue(sale);
//       console.log(totalRev);
//     });
//     seller.revenue = totalRev;
//   });
// }
