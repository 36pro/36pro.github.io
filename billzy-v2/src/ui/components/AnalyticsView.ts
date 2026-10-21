import { appStore } from '../state';
import { BILL_DEFINITIONS } from '../../core/contracts/utility';
import { getSeason, getSeasonName, calculatePrepaidEfficiency } from '../../core/domain/seasonal';

export function renderAnalyticsView(): string {
  const payments = appStore.getPayments();
  const currentSeason = getSeason(new Date());
  const currentSeasonName = getSeasonName(new Date());

  const eligibleBills = [
    'rupnagarDesco',
    'uttaraDesco',
    'rupnagarGas',
    'matuailGas',
    'noakhaliPalli',
    'uttaraWater'
  ];

  const efficiencyMetrics = eligibleBills
    .map(billId => calculatePrepaidEfficiency(payments, billId, new Date()))
    .filter((m): m is NonNullable<typeof m> => m !== null);

  const maxRate = Math.max(1, ...efficiencyMetrics.map(m => m.daysPer1k));

  return `
    <div class="analyticsViewContainer">
      <div class="analyticsHeader">
        <div class="analyticsTitleBlock">
          <div class="seasonalBadge ${currentSeason}">
            <span class="seasonDot"></span>
            <span>ACTIVE SEASON: ${currentSeasonName.toUpperCase()} (BANGLADESH)</span>
          </div>
          <h1 class="analyticsTitle">Seasonal Consumption & Burn Rate Intelligence</h1>
          <p class="analyticsSubtitle">
            Dynamic efficiency intelligence weighting Summer (March–September) cooling load against Winter (October–February) baselines.
          </p>
        </div>
      </div>

      <div class="analyticsGrid">
        <div class="analyticsCard efficiencyCard">
          <div class="cardHeaderRow">
            <div>
              <h2 class="cardHeading">Burn Rate Efficiency (Days / 1,000 Tk)</h2>
              <p class="cardSub">How many days each 1,000 BDT recharge lasts based on seasonal cycle data</p>
            </div>
            <span class="metricPill activePill">Higher is Better</span>
          </div>

          <div class="efficiencyBarChart">
            ${
              efficiencyMetrics.length === 0
                ? '<div class="noDataNotice">Need at least 2 consecutive payments to calculate burn rate.</div>'
                : efficiencyMetrics
                    .map(item => {
                      const billDef = BILL_DEFINITIONS[item.billId as keyof typeof BILL_DEFINITIONS];
                      const name = billDef ? billDef.name : item.billId;
                      const pct = Math.min(100, Math.round((item.daysPer1k / maxRate) * 100));

                      return `
                      <div class="efficiencyRow">
                        <div class="efficiencyLabelCol">
                          <span class="utilityNameText">${name}</span>
                          ${
                            item.isSeasonal
                              ? `<span class="seasonTag ${currentSeason}">${item.seasonName}</span>`
                              : ''
                          }
                        </div>
                        <div class="barTrackCol">
                          <div class="barTrack">
                            <div class="barFill" style="width: ${pct}%;"></div>
                          </div>
                        </div>
                        <div class="efficiencyValueCol">
                          <strong>${item.daysPer1k}</strong> <span class="unitText">days/1k</span>
                        </div>
                      </div>
                    `;
                    })
                    .join('')
            }
          </div>
        </div>

        <div class="analyticsCard dailyCostCard">
          <div class="cardHeaderRow">
            <div>
              <h2 class="cardHeading">Estimated Daily Burn Rate</h2>
              <p class="cardSub">Average daily cost based on recent cycle intervals</p>
            </div>
          </div>

          <div class="dailyCostList">
            ${
              efficiencyMetrics.length === 0
                ? '<div class="noDataNotice">Recharge history required.</div>'
                : efficiencyMetrics
                    .map(item => {
                      const billDef = BILL_DEFINITIONS[item.billId as keyof typeof BILL_DEFINITIONS];
                      const name = billDef ? billDef.name : item.billId;

                      return `
                      <div class="dailyCostItem">
                        <div class="costHeader">
                          <span class="costUtilityName">${name}</span>
                          <span class="costAmount">৳ ${item.dailyBurn} <span class="perDay">/ day</span></span>
                        </div>
                        <div class="costMeta">
                          <span>${item.totalDays} Days Tracked</span>
                          <span>•</span>
                          <span>৳ ${item.totalAmt.toLocaleString()} Total Recharges</span>
                        </div>
                      </div>
                    `;
                    })
                    .join('')
            }
          </div>
        </div>
      </div>

      <div class="seasonalInfoBanner">
        <div class="infoIcon">ℹ️</div>
        <div class="infoText">
          <strong>Seasonal Adjustment Engine</strong>: Electricity, Gas, and Water rates fluctuate significantly between hot humid summer months (March–September) with heavy air conditioning / fans and cool winter months (October–February). Billzy automatically segments burn rates by seasonal cycles to eliminate distorted winter-to-summer forecasts.
        </div>
      </div>
    </div>
  `;
}
