const Scan = require("../models/Scan");

async function getTrendSummary(days = 14) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const [categoryBreakdown, dailyFrequency, topKeywords] = await Promise.all([
    Scan.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]),
    Scan.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]),
    Scan.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $project: {
          words: {
            $split: [
              {
                $replaceAll: {
                  input: { $toLower: "$content" },
                  find: ",",
                  replacement: " "
                }
              },
              " "
            ]
          }
        }
      },
      { $unwind: "$words" },
      {
        $match: {
          words: { $nin: ["", "the", "and", "for", "you", "your", "to", "is", "a", "of"] }
        }
      },
      { $group: { _id: "$words", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 12 }
    ])
  ]);

  return {
    categoryBreakdown: categoryBreakdown.map((item) => ({ category: item._id || "other", count: item.count })),
    dailyFrequency: dailyFrequency.map((item) => ({ date: item._id, count: item.count })),
    topKeywords: topKeywords.map((item) => ({ keyword: item._id, count: item.count }))
  };
}

module.exports = { getTrendSummary };
