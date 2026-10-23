
const {
  CostExplorerClient,
  GetCostAndUsageCommand,
} = require("@aws-sdk/client-cost-explorer");

const client = new CostExplorerClient({
  region: "us-east-1",
});

function getDateString(date) {
  return date.toISOString().slice(0, 10);
}

function getMonthStart(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

async function getAwsCosts() {
  // Cost Explorer's End date is exclusive.
  const today = new Date();
  const endDate = getMonthStart(today);

  const startDate = new Date(endDate);
  startDate.setUTCMonth(startDate.getUTCMonth() - 6);

  const command = new GetCostAndUsageCommand({
    TimePeriod: {
      Start: getDateString(startDate),
      End: getDateString(endDate),
    },
    Granularity: "MONTHLY",
    Metrics: ["UnblendedCost"],
    GroupBy: [
      {
        Type: "DIMENSION",
        Key: "SERVICE",
      },
    ],
  });

  const response = await client.send(command);

  const months = (response.ResultsByTime || []).map((period) => {
    const services = (period.Groups || []).map((group) => ({
      service: group.Keys?.[0] || "Unknown",
      cost: Number(
        group.Metrics?.UnblendedCost?.Amount || 0
      ),
      unit: group.Metrics?.UnblendedCost?.Unit || "USD",
    }));

    const totalCost = services.reduce(
      (sum, service) => sum + service.cost,
      0
    );

    return {
      start: period.TimePeriod?.Start,
      end: period.TimePeriod?.End,
      estimated: period.Estimated ?? false,
      totalCost: Number(totalCost.toFixed(6)),
      currency: services[0]?.unit || "USD",
      services: services.sort((a, b) => b.cost - a.cost),
    };
  });

  return {
    source: "aws-cost-explorer",
    readOnly: true,
    currency: "USD",
    period: {
      start: getDateString(startDate),
      endExclusive: getDateString(endDate),
    },
    months,
    note:
      "Actual AWS Cost Explorer data. The current incomplete month is excluded.",
  };
}

module.exports = { getAwsCosts };
