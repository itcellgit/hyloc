import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/auth';
import api from '../services/api';
import '../styles/Dashboard.css';
import '../styles/ExpandedChartModal.css';

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH_COLORS = ['#3b82f6', '#06b6d4', '#10b981', '#84cc16', '#eab308', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6', '#6366f1', '#0ea5e9', '#14b8a6'];
const FISCAL_YEAR_START = 2025;
const FISCAL_MONTH_SEQUENCE = Array.from({ length: 12 }, (_, i) => {
  const month = ((3 + i) % 12) + 1; // April (4) through March (3)
  const year = month >= 4 ? FISCAL_YEAR_START : FISCAL_YEAR_START + 1;
  return { month, year };
});

// SVG Line Chart Component for Industry 4.0 KPI
const Industry40LineChart = ({
  title,
  subtitle,
  labels,
  actuals,
  targets,
  yAxisFormatter,
  showAxisLabels = true,
  showPointLabels = false,
  xAxisTitle = 'Month',
  yAxisTitle = 'Value',
}) => {
  const svgWidth = 900;
  const svgHeight = 350;
  const padding = 60;
  const plotWidth = svgWidth - padding * 2;
  const plotHeight = svgHeight - padding * 2;

  const maxVal = Math.max(...actuals, ...targets, 1);
  const minVal = 0;
  const range = maxVal - minVal;

  const getX = (idx) => padding + (idx / (labels.length - 1 || 1)) * plotWidth;
  const getY = (val) => svgHeight - padding - ((val - minVal) / range) * plotHeight;

  // Generate line paths
  const actualPath = actuals
    .map((val, idx) => `${idx === 0 ? 'M' : 'L'} ${getX(idx)} ${getY(val)}`)
    .join(' ');
  const targetPath = targets
    .map((val, idx) => `${idx === 0 ? 'M' : 'L'} ${getX(idx)} ${getY(val)}`)
    .join(' ');

  const yTicks = [0, 0.2, 0.4, 0.6, 0.8, 1].map((ratio) => {
    const val = Math.round(minVal + ratio * range);
    return Number.isFinite(val) ? val : 0;
  });
  const uniqueYTicks = yTicks.filter((val, idx, arr) => arr.indexOf(val) === idx);
  const formatY = yAxisFormatter || ((val) => val);

  return (
    <div className="industry40-chart-wrapper">
      <div className="chart-header">
        <h2 className="industry40-chart-title">{title}</h2>
        {subtitle && <p className="chart-subtitle">{subtitle}</p>}
      </div>
      <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="industry40-chart-svg">
        {/* Grid lines */}
        {[0, 0.2, 0.4, 0.6, 0.8, 1].map((ratio, i) => {
          const y = svgHeight - padding - ratio * plotHeight;
          return (
            <line
              key={`grid-${i}`}
              x1={padding}
              y1={y}
              x2={svgWidth - padding}
              y2={y}
              stroke="#e5e7eb"
              strokeWidth="1"
              strokeDasharray="5,5"
            />
          );
        })}

        {/* Y-axis line */}
        <line x1={padding} y1={padding} x2={padding} y2={svgHeight - padding} stroke="#1f2937" strokeWidth="2" />
        {/* X-axis line */}
        <line x1={padding} y1={svgHeight - padding} x2={svgWidth - padding} y2={svgHeight - padding} stroke="#1f2937" strokeWidth="2" />

        {/* Target line (background) */}
        <path d={targetPath} stroke="#ffb74d" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />

        {/* Actual line (foreground) */}
        <path d={actualPath} stroke="#41aafe" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />

        {/* Target dots */}
        {targets.map((val, idx) => (
          <circle key={`target-dot-${idx}`} cx={getX(idx)} cy={getY(val)} r="5" fill="#ffb74d" stroke="white" strokeWidth="2" />
        ))}

        {/* Actual dots */}
        {actuals.map((val, idx) => (
          <circle key={`actual-dot-${idx}`} cx={getX(idx)} cy={getY(val)} r="5" fill="#41aafe" stroke="white" strokeWidth="2" />
        ))}

        {/* X-axis labels */}
        {showAxisLabels &&
          labels.map((label, idx) => (
            <text
              key={`x-label-${idx}`}
              x={getX(idx)}
              y={svgHeight - padding + 30}
              textAnchor="middle"
              fontSize="12"
              fontWeight="500"
              fill="#4b5563"
            >
              {label}
            </text>
          ))}

        {/* Y-axis labels */}
        {showAxisLabels &&
          uniqueYTicks.map((val, i) => {
            const ratio = range === 0 ? 0 : (val - minVal) / range;
            const y = svgHeight - padding - ratio * plotHeight;
            return (
              <text key={`y-label-${i}`} x={padding - 15} y={y + 5} textAnchor="end" fontSize="12" fontWeight="500" fill="#4b5563">
                {formatY(val)}
              </text>
            );
          })}

        {/* Axis titles */}
        {showAxisLabels && (
          <>
            <text x={svgWidth / 2} y={svgHeight - 8} textAnchor="middle" fontSize="12" fontWeight="600" fill="#374151">
              {xAxisTitle}
            </text>
            <text
              x={20}
              y={svgHeight / 2}
              textAnchor="middle"
              fontSize="12"
              fontWeight="600"
              fill="#374151"
              transform={`rotate(-90 20 ${svgHeight / 2})`}
            >
              {yAxisTitle}
            </text>
          </>
        )}

        {/* Data labels */}
        {showPointLabels &&
          actuals.map((val, idx) => (
            <text
              key={`actual-label-${idx}`}
              x={getX(idx)}
              y={getY(val) - 10}
              textAnchor="middle"
              fontSize="10"
              fontWeight="600"
              fill="#1f2937"
            >
              {formatY(val)}
            </text>
          ))}
        {showPointLabels &&
          targets.map((val, idx) => (
            <text
              key={`target-label-${idx}`}
              x={getX(idx)}
              y={getY(val) + 14}
              textAnchor="middle"
              fontSize="10"
              fontWeight="600"
              fill="#b45309"
            >
              {formatY(val)}
            </text>
          ))}
      </svg>

      {/* Legend */}
      <div className="industry40-legend">
        <div className="legend-item">
          <span className="legend-line actual"></span>
          <span className="legend-label">Actual Value</span>
        </div>
        <div className="legend-item">
          <span className="legend-line target"></span>
          <span className="legend-label">Target Value</span>
        </div>
      </div>
    </div>
  );
};

// Bar Chart Component for Green Factory
const GreenFactoryBarChart = ({ title, subtitle, labels, values, showAxisLabels = true, xAxisTitle = 'Month', yAxisTitle = 'Value' }) => {
  const svgWidth = 900;
  const svgHeight = 350;
  const padding = 60;
  const plotWidth = svgWidth - padding * 2;
  const plotHeight = svgHeight - padding * 2;

  const maxVal = Math.max(...values, 100);
  const minVal = 0;
  const range = maxVal - minVal;

  const barWidth = plotWidth / (values.length * 1.5);
  const getX = (idx) => padding + (idx * plotWidth) / values.length + (plotWidth / values.length / 2 - barWidth / 2);
  const getY = (val) => svgHeight - padding - ((val - minVal) / range) * plotHeight;
  const getBarHeight = (val) => ((val - minVal) / range) * plotHeight;

  return (
    <div className="industry40-chart-wrapper">
      <div className="chart-header">
        <h2 className="industry40-chart-title">{title}</h2>
        <p className="chart-subtitle">{subtitle}</p>
      </div>
      <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="industry40-chart-svg">
        {/* Grid lines */}
        {[0, 0.2, 0.4, 0.6, 0.8, 1].map((ratio, i) => {
          const y = svgHeight - padding - ratio * plotHeight;
          return (
            <line
              key={`grid-${i}`}
              x1={padding}
              y1={y}
              x2={svgWidth - padding}
              y2={y}
              stroke="#e5e7eb"
              strokeWidth="1"
              strokeDasharray="5,5"
            />
          );
        })}

        {/* Y-axis line */}
        <line x1={padding} y1={padding} x2={padding} y2={svgHeight - padding} stroke="#1f2937" strokeWidth="2" />
        {/* X-axis line */}
        <line x1={padding} y1={svgHeight - padding} x2={svgWidth - padding} y2={svgHeight - padding} stroke="#1f2937" strokeWidth="2" />

        {/* Bars */}
        {values.map((val, idx) => (
          <g key={`bar-${idx}`}>
            <rect
              x={getX(idx)}
              y={getY(val)}
              width={barWidth}
              height={getBarHeight(val)}
              fill="#10b981"
              stroke="white"
              strokeWidth="1"
              rx="4"
            />
            {/* Value label on top of bar */}
            <text
              x={getX(idx) + barWidth / 2}
              y={getY(val) - 8}
              textAnchor="middle"
              fontSize="11"
              fontWeight="600"
              fill="#10b981"
            >
              {val.toFixed(1)}%
            </text>
          </g>
        ))}

        {/* X-axis labels */}
        {showAxisLabels &&
          labels.map((label, idx) => (
            <text
              key={`x-label-${idx}`}
              x={padding + (idx * plotWidth) / labels.length + (plotWidth / labels.length / 2)}
              y={svgHeight - padding + 30}
              textAnchor="middle"
              fontSize="11"
              fontWeight="500"
              fill="#4b5563"
            >
              {label}
            </text>
          ))}

        {/* Y-axis labels */}
        {showAxisLabels &&
          [0, 0.2, 0.4, 0.6, 0.8, 1].map((ratio, i) => {
            const val = Math.round(minVal + ratio * range);
            const y = svgHeight - padding - ratio * plotHeight;
            return (
              <text key={`y-label-${i}`} x={padding - 15} y={y + 5} textAnchor="end" fontSize="12" fontWeight="500" fill="#4b5563">
                {val}%
              </text>
            );
          })}

        {/* Axis titles */}
        {showAxisLabels && (
          <>
            <text x={svgWidth / 2} y={svgHeight - 8} textAnchor="middle" fontSize="12" fontWeight="600" fill="#374151">
              {xAxisTitle}
            </text>
            <text
              x={20}
              y={svgHeight / 2}
              textAnchor="middle"
              fontSize="12"
              fontWeight="600"
              fill="#374151"
              transform={`rotate(-90 20 ${svgHeight / 2})`}
            >
              {yAxisTitle}
            </text>
          </>
        )}
      </svg>

      {/* Legend */}
      <div className="industry40-legend">
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: '#10b981' }}></span>
          <span className="legend-label">Green Factory %</span>
        </div>
      </div>
    </div>
  );
};

// Bar Chart Component for On Time Delivery (Target vs Achieved)
const Box4ThemeBarChart = ({ title, subtitle, labels, values, showAxisLabels = true, xAxisTitle = 'Month', yAxisTitle = 'Value', showHeader = true }) => {
  const svgWidth = 900;
  const svgHeight = 350;
  const padding = 60;
  const plotWidth = svgWidth - padding * 2;
  const plotHeight = svgHeight - padding * 2;

  const maxVal = Math.max(...values, 100);
  const minVal = 0;
  const range = maxVal - minVal;

  const barWidth = plotWidth / (values.length * 1.5);
  const getX = (idx) => padding + (idx * plotWidth) / values.length + (plotWidth / values.length / 2 - barWidth / 2);
  const getY = (val) => svgHeight - padding - ((val - minVal) / range) * plotHeight;
  const getBarHeight = (val) => ((val - minVal) / range) * plotHeight;

  return (
    <div className="industry40-chart-wrapper">
      {showHeader && (
        <div className="chart-header">
          <h2 className="industry40-chart-title">{title}</h2>
          <p className="chart-subtitle">{subtitle}</p>
        </div>
      )}
      <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="industry40-chart-svg">
        {/* Grid lines */}
        {[0, 0.2, 0.4, 0.6, 0.8, 1].map((ratio, i) => {
          const y = svgHeight - padding - ratio * plotHeight;
          return (
            <line
              key={`grid-${i}`}
              x1={padding}
              y1={y}
              x2={svgWidth - padding}
              y2={y}
              stroke="#e5e7eb"
              strokeWidth="1"
              strokeDasharray="5,5"
            />
          );
        })}

        {/* Y-axis line */}
        <line x1={padding} y1={padding} x2={padding} y2={svgHeight - padding} stroke="#1f2937" strokeWidth="2" />
        {/* X-axis line */}
        <line x1={padding} y1={svgHeight - padding} x2={svgWidth - padding} y2={svgHeight - padding} stroke="#1f2937" strokeWidth="2" />

        {/* Bars */}
        {values.map((val, idx) => (
          <g key={`bar-${idx}`}>
            <rect
              x={getX(idx)}
              y={getY(val)}
              width={barWidth}
              height={getBarHeight(val)}
              fill="#3b82f6"
              stroke="white"
              strokeWidth="1"
              rx="4"
            />
            {/* Value label on top of bar */}
            <text
              x={getX(idx) + barWidth / 2}
              y={getY(val) - 8}
              textAnchor="middle"
              fontSize="11"
              fontWeight="600"
              fill="#1e40af"
            >
              {Math.round(val)}%
            </text>
          </g>
        ))}

        {/* X-axis labels */}
        {showAxisLabels &&
          labels.map((label, idx) => (
            <text
              key={`x-label-${idx}`}
              x={padding + (idx * plotWidth) / labels.length + (plotWidth / labels.length / 2)}
              y={svgHeight - padding + 30}
              textAnchor="middle"
              fontSize="11"
              fontWeight="500"
              fill="#4b5563"
            >
              {label}
            </text>
          ))}

        {/* Y-axis labels */}
        {showAxisLabels &&
          [0, 0.2, 0.4, 0.6, 0.8, 1].map((ratio, i) => {
            const val = Math.round(minVal + ratio * range);
            const y = svgHeight - padding - ratio * plotHeight;
            return (
              <text key={`y-label-${i}`} x={padding - 15} y={y + 5} textAnchor="end" fontSize="12" fontWeight="500" fill="#4b5563">
                {val}
              </text>
            );
          })}

        {/* Axis titles */}
        {showAxisLabels && (
          <>
            <text x={svgWidth / 2} y={svgHeight - 8} textAnchor="middle" fontSize="12" fontWeight="600" fill="#374151">
              {xAxisTitle}
            </text>
            <text
              x={20}
              y={svgHeight / 2}
              textAnchor="middle"
              fontSize="12"
              fontWeight="600"
              fill="#374151"
              transform={`rotate(-90 20 ${svgHeight / 2})`}
            >
              {yAxisTitle}
            </text>
          </>
        )}
      </svg>

      {/* Legend */}
      <div className="industry40-legend">
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: '#3b82f6' }}></span>
          <span className="legend-label">{subtitle}</span>
        </div>
      </div>
    </div>
  );
};

const Box4EmployeesLineChart = ({ title, subtitle, labels, values, showAxisLabels = true, xAxisTitle = 'Month', yAxisTitle = 'Value', showHeader = true }) => {
  const svgWidth = 900;
  const svgHeight = 350;
  const padding = 60;
  const plotWidth = svgWidth - padding * 2;
  const plotHeight = svgHeight - padding * 2;

  const maxVal = Math.max(...values, 1);
  const minVal = 0;
  const range = maxVal - minVal;

  const getX = (idx) => padding + (idx / (labels.length - 1 || 1)) * plotWidth;
  const getY = (val) => svgHeight - padding - ((val - minVal) / range) * plotHeight;

  const path = values
    .map((val, idx) => `${idx === 0 ? 'M' : 'L'} ${getX(idx)} ${getY(val)}`)
    .join(' ');

  const yTicks = [0, 0.2, 0.4, 0.6, 0.8, 1].map((ratio) => {
    const val = Math.round(minVal + ratio * range);
    return Number.isFinite(val) ? val : 0;
  });
  const uniqueYTicks = yTicks.filter((val, idx, arr) => arr.indexOf(val) === idx);

  return (
    <div className="industry40-chart-wrapper">
      {showHeader && (
        <div className="chart-header">
          <h2 className="industry40-chart-title">{title}</h2>
          {subtitle && <p className="chart-subtitle">{subtitle}</p>}
        </div>
      )}
      <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="industry40-chart-svg">
        {/* Grid lines */}
        {[0, 0.2, 0.4, 0.6, 0.8, 1].map((ratio, i) => {
          const y = svgHeight - padding - ratio * plotHeight;
          return (
            <line
              key={`grid-${i}`}
              x1={padding}
              y1={y}
              x2={svgWidth - padding}
              y2={y}
              stroke="#e5e7eb"
              strokeWidth="1"
              strokeDasharray="5,5"
            />
          );
        })}

        {/* Y-axis line */}
        <line x1={padding} y1={padding} x2={padding} y2={svgHeight - padding} stroke="#1f2937" strokeWidth="2" />
        {/* X-axis line */}
        <line x1={padding} y1={svgHeight - padding} x2={svgWidth - padding} y2={svgHeight - padding} stroke="#1f2937" strokeWidth="2" />

        {/* Line */}
        <path d={path} stroke="#ef4444" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />

        {/* Dots */}
        {values.map((val, idx) => (
          <circle key={`dot-${idx}`} cx={getX(idx)} cy={getY(val)} r="5" fill="#ef4444" stroke="white" strokeWidth="2" />
        ))}

        {/* Data labels on points */}
        {values.map((val, idx) => (
          <text
            key={`point-label-${idx}`}
            x={getX(idx)}
            y={getY(val) - 15}
            textAnchor="middle"
            fontSize="10"
            fontWeight="600"
            fill="#991b1b"
          >
            {Math.round(val)}
          </text>
        ))}

        {/* X-axis labels */}
        {showAxisLabels &&
          labels.map((label, idx) => (
            <text
              key={`x-label-${idx}`}
              x={padding + (idx / (labels.length - 1 || 1)) * plotWidth}
              y={svgHeight - padding + 30}
              textAnchor="middle"
              fontSize="11"
              fontWeight="500"
              fill="#4b5563"
            >
              {label}
            </text>
          ))}

        {/* Y-axis labels */}
        {showAxisLabels &&
          uniqueYTicks.map((val, i) => {
            const ratio = (val - minVal) / range;
            const y = svgHeight - padding - ratio * plotHeight;
            return (
              <text key={`y-label-${i}`} x={padding - 15} y={y + 5} textAnchor="end" fontSize="12" fontWeight="500" fill="#4b5563">
                {val}
              </text>
            );
          })}

        {/* Axis titles */}
        {showAxisLabels && (
          <>
            <text x={svgWidth / 2} y={svgHeight - 8} textAnchor="middle" fontSize="12" fontWeight="600" fill="#374151">
              {xAxisTitle}
            </text>
            <text
              x={20}
              y={svgHeight / 2}
              textAnchor="middle"
              fontSize="12"
              fontWeight="600"
              fill="#374151"
              transform={`rotate(-90 20 ${svgHeight / 2})`}
            >
              {yAxisTitle}
            </text>
          </>
        )}
      </svg>

      {/* Legend */}
      <div className="industry40-legend">
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: '#ef4444' }}></span>
          <span className="legend-label">{subtitle}</span>
        </div>
      </div>
    </div>
  );
};

const OnTimeDeliveryBarChart = ({ title, subtitle, labels, actuals, targets, showAxisLabels = true, xAxisTitle = 'Month', yAxisTitle = 'Value' }) => {
  const svgWidth = 900;
  const svgHeight = 350;
  const padding = 60;
  const plotWidth = svgWidth - padding * 2;
  const plotHeight = svgHeight - padding * 2;

  const maxVal = Math.max(...actuals, ...targets, 100);
  const minVal = 0;
  const range = maxVal - minVal;

  const groupWidth = plotWidth / labels.length;
  const barWidth = groupWidth / 3;
  const getY = (val) => svgHeight - padding - ((val - minVal) / range) * plotHeight;
  const getBarHeight = (val) => ((val - minVal) / range) * plotHeight;

  return (
    <div className="industry40-chart-wrapper">
      <div className="chart-header">
        <h2 className="industry40-chart-title">{title}</h2>
        {subtitle && <p className="chart-subtitle">{subtitle}</p>}
      </div>
      <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="industry40-chart-svg">
        {/* Grid lines */}
        {[0, 0.2, 0.4, 0.6, 0.8, 1].map((ratio, i) => {
          const y = svgHeight - padding - ratio * plotHeight;
          return (
            <line
              key={`grid-${i}`}
              x1={padding}
              y1={y}
              x2={svgWidth - padding}
              y2={y}
              stroke="#e5e7eb"
              strokeWidth="1"
              strokeDasharray="5,5"
            />
          );
        })}

        {/* Y-axis line */}
        <line x1={padding} y1={padding} x2={padding} y2={svgHeight - padding} stroke="#1f2937" strokeWidth="2" />
        {/* X-axis line */}
        <line x1={padding} y1={svgHeight - padding} x2={svgWidth - padding} y2={svgHeight - padding} stroke="#1f2937" strokeWidth="2" />

        {/* Bars */}
        {labels.map((label, idx) => {
          const baseX = padding + idx * groupWidth + groupWidth / 2;
          const targetVal = targets[idx] ?? 0;
          const actualVal = actuals[idx] ?? 0;
          const targetX = baseX - barWidth - 4;
          const actualX = baseX + 4;

          return (
            <g key={`bar-group-${idx}`}>
              <rect
                x={targetX}
                y={getY(targetVal)}
                width={barWidth}
                height={getBarHeight(targetVal)}
                fill="#fbbf24"
                stroke="white"
                strokeWidth="1"
                rx="4"
              />
              <rect
                x={actualX}
                y={getY(actualVal)}
                width={barWidth}
                height={getBarHeight(actualVal)}
                fill="#22c55e"
                stroke="white"
                strokeWidth="1"
                rx="4"
              />
              <text
                x={targetX + barWidth / 2}
                y={getY(targetVal) - 8}
                textAnchor="middle"
                fontSize="10"
                fontWeight="600"
                fill="#92400e"
              >
                {Math.round(targetVal)}%
              </text>
              <text
                x={actualX + barWidth / 2}
                y={getY(actualVal) - 8}
                textAnchor="middle"
                fontSize="10"
                fontWeight="600"
                fill="#166534"
              >
                {Math.round(actualVal)}%
              </text>
            </g>
          );
        })}

        {/* X-axis labels */}
        {showAxisLabels &&
          labels.map((label, idx) => (
            <text
              key={`x-label-${idx}`}
              x={padding + idx * groupWidth + groupWidth / 2}
              y={svgHeight - padding + 30}
              textAnchor="middle"
              fontSize="11"
              fontWeight="500"
              fill="#4b5563"
            >
              {label}
            </text>
          ))}

        {/* Y-axis labels */}
        {showAxisLabels &&
          [0, 0.2, 0.4, 0.6, 0.8, 1].map((ratio, i) => {
            const val = Math.round(minVal + ratio * range);
            const y = svgHeight - padding - ratio * plotHeight;
            return (
              <text key={`y-label-${i}`} x={padding - 15} y={y + 5} textAnchor="end" fontSize="12" fontWeight="500" fill="#4b5563">
                {val}
              </text>
            );
          })}

        {/* Axis titles */}
        {showAxisLabels && (
          <>
            <text x={svgWidth / 2} y={svgHeight - 8} textAnchor="middle" fontSize="12" fontWeight="600" fill="#374151">
              {xAxisTitle}
            </text>
            <text
              x={20}
              y={svgHeight / 2}
              textAnchor="middle"
              fontSize="12"
              fontWeight="600"
              fill="#374151"
              transform={`rotate(-90 20 ${svgHeight / 2})`}
            >
              {yAxisTitle}
            </text>
          </>
        )}
      </svg>

      {/* Legend */}
      <div className="industry40-legend">
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: '#fbbf24' }}></span>
          <span className="legend-label">Target</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: '#22c55e' }}></span>
          <span className="legend-label">Achieved</span>
        </div>
      </div>
    </div>
  );
};

// Speedometer Gauge Component for Plant Efficiency
const SpeedometerGauge = ({ efficiency, month, year }) => {
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  
  // Calculate angle: -180 to 0 degrees (left to right semicircle)
  // 0-60 red, 61-80 yellow, >80 green
  const angle = -180 + (Math.min(Math.max(efficiency, 0), 100) / 100) * 180;
  const radians = (angle * Math.PI) / 180;
  const x = 150 + radius * Math.cos(radians);
  const y = 150 + radius * Math.sin(radians);

  let color = '#ef4444'; // red
  let status = 'Critical';
  if (efficiency > 80) {
    color = '#22c55e'; // green
    status = 'Excellent';
  } else if (efficiency > 60) {
    color = '#eab308'; // yellow
    status = 'Good';
  }

  return (
    <div className="speedometer-container">
      <h3 className="speedometer-title">{month} {year}</h3>
      <svg viewBox="0 0 300 200" className="speedometer-svg">
        {/* Background arc */}
        <path
          d="M 70 150 A 80 80 0 0 1 230 150"
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="20"
          strokeLinecap="round"
        />
        
        {/* Red zone (0-60) */}
        <path
          d="M 70 150 A 80 80 0 0 1 126 82"
          fill="none"
          stroke="#ef4444"
          strokeWidth="20"
          strokeLinecap="round"
        />
        
        {/* Yellow zone (61-80) */}
        <path
          d="M 126 82 A 80 80 0 0 1 174 82"
          fill="none"
          stroke="#eab308"
          strokeWidth="20"
          strokeLinecap="round"
        />
        
        {/* Green zone (81-100) */}
        <path
          d="M 174 82 A 80 80 0 0 1 230 150"
          fill="none"
          stroke="#22c55e"
          strokeWidth="20"
          strokeLinecap="round"
        />

        {/* Needle */}
        <line x1="150" y1="150" x2={x} y2={y} stroke={color} strokeWidth="4" strokeLinecap="round" />
        
        {/* Arrow tip on needle */}
        <polygon
          points={`${x},${y} ${x - 6},${y + 8} ${x + 6},${y + 8}`}
          fill={color}
        />
        
        {/* Center dot */}
        <circle cx="150" cy="150" r="8" fill={color} />

        {/* Labels */}
        <text x="75" y="175" fontSize="12" fontWeight="600" fill="#4b5563" textAnchor="middle">0</text>
        <text x="150" y="50" fontSize="12" fontWeight="600" fill="#4b5563" textAnchor="middle">50</text>
        <text x="225" y="175" fontSize="12" fontWeight="600" fill="#4b5563" textAnchor="middle">100</text>
      </svg>
      
      <div className="speedometer-display">
        <div className="efficiency-value">{efficiency.toFixed(1)}%</div>
        <div className={`efficiency-status status-${status.toLowerCase()}`}>{status}</div>
      </div>
    </div>
  );
};

function UserDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    totalKPIs: 0,
    activeKPIs: 0,
    totalPillars: 0
  });
  const [kpiLookup, setKpiLookup] = useState({});
  const [kpiCharts, setKpiCharts] = useState([]);
  const [chartsLoading, setChartsLoading] = useState(false);
  const [industry40Chart, setIndustry40Chart] = useState(null);
  const [industry40Loading, setIndustry40Loading] = useState(false);
  const [zeroQualityChart, setZeroQualityChart] = useState(null);
  const [zeroQualityLoading, setZeroQualityLoading] = useState(false);
  const [monthlySalesData, setMonthlySalesData] = useState([]);
  const [salesLoading, setSalesLoading] = useState(false);
  const [selectedSalesIndex, setSelectedSalesIndex] = useState(0);
  const [monthlyProfitData, setMonthlyProfitData] = useState([]);
  const [profitabilityLoading, setProfitabilityLoading] = useState(false);
  const [selectedProfitIndex, setSelectedProfitIndex] = useState(0);
  const [plantEfficiency, setPlantEfficiency] = useState({});
  const [selectedFiscalIndex, setSelectedFiscalIndex] = useState(0);
  const [monthlyEfficiency, setMonthlyEfficiency] = useState([]);
  const [efficiencyLoading, setEfficiencyLoading] = useState(false);
  const [greenFactoryChart, setGreenFactoryChart] = useState(null);
  const [greenFactoryLoading, setGreenFactoryLoading] = useState(false);
  const [zeroAccidentsChart, setZeroAccidentsChart] = useState(null);
  const [zeroAccidentsLoading, setZeroAccidentsLoading] = useState(false);
  const [onTimeDeliveryChart, setOnTimeDeliveryChart] = useState(null);
  const [onTimeDeliveryLoading, setOnTimeDeliveryLoading] = useState(false);
  const [themeChart, setThemeChart] = useState(null);
  const [themeChartLoading, setThemeChartLoading] = useState(false);
  const [employeesChart, setEmployeesChart] = useState(null);
  const [employeesChartLoading, setEmployeesChartLoading] = useState(false);
  const [expandedChart, setExpandedChart] = useState(null);
  const [expandedChartData, setExpandedChartData] = useState(null);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const menuItems = [
    { id: 1, label: 'Dashboard', icon: '📊', path: '/user-dashboard' },
    { id: 2, label: 'KMIs', icon: '📈', path: '/user-kmis' },
    { id: 3, label: 'Pillars', icon: '🏛️', path: '/user-pillars' },
  ];

  useEffect(() => {
    const token = authService.getToken();
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      navigate('/login', { replace: true });
      return;
    }

    setUser(JSON.parse(userData));

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [navigate]);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [kpisRes, pillarsRes] = await Promise.all([
        api.get('/kpis'),
        api.get('/pillers')
      ]);
      
      const kpis = kpisRes.data?.data || [];
      const pillars = pillarsRes.data?.data || [];

      // Debug: Log all KPI titles to help with matching
      console.log('\n=== ALL KPIs IN DATABASE ===');
      kpis.forEach((k, idx) => {
        console.log(`${idx + 1}. [${k.id}] "${k.title}"`);
      });

      // Debug: Show what we're searching for
      console.log('\n=== KPI SEARCH RESULTS ===');
      const industryKpis = kpis.filter(k => (k.title || '').toLowerCase().includes('industry'));
      console.log(`Industry KPIs found: ${industryKpis.length}`, industryKpis.map(k => k.title));
      
      const qualityKpis = kpis.filter(k => 
        (k.title || '').toLowerCase().includes('quality') || 
        (k.title || '').toLowerCase().includes('complaint')
      );
      console.log(`Quality KPIs found: ${qualityKpis.length}`, qualityKpis.map(k => k.title));
      
      const salesKpis = kpis.filter(k => 
        (k.title || '').toLowerCase().includes('sales') || 
        (k.title || '').toLowerCase().includes('revenue')
      );
      console.log(`Sales KPIs found: ${salesKpis.length}`, salesKpis.map(k => k.title));
      
      const profitKpis = kpis.filter(k => 
        (k.title || '').toLowerCase().includes('profit') || 
        (k.title || '').toLowerCase().includes('pl')
      );
      console.log(`Profit KPIs found: ${profitKpis.length}`, profitKpis.map(k => k.title));
      console.log('===========================\n');

      const lookup = kpis.reduce((acc, k) => {
        const name = k.title || k.kpi_name || k.name || `KPI ${k.id}`;
        acc[k.id] = name;
        return acc;
      }, {});
      setKpiLookup(lookup);
      
      setStats({
        totalKPIs: kpis.length,
        activeKPIs: kpis.filter(k => k.fin_year).length,
        totalPillars: pillars.length
      });

      loadKpiCharts(lookup);
      loadIndustry40Chart(lookup);
      loadZeroQualityChart();
      loadSalesChart();
      loadProfitabilityData();
      loadPlantEfficiency();
      loadGreenFactoryChart(lookup);
      loadZeroAccidentsChart(lookup);
      loadOnTimeDeliveryChart();
      loadThemeChart();
      loadEmployeesChart();
    } catch (err) {
      console.error('Failed to load stats', err);
    }
  };

  const loadPlantEfficiency = async () => {
    try {
      setEfficiencyLoading(true);
      const kpiValuesRes = await api.get('/kpi-values');
      const kpiValues = (kpiValuesRes.data?.data || []).slice(0, 10); // cap to avoid large downloads

      // Calculate efficiency for each month in fiscal year Apr 2025 - Mar 2026
      const efficiencyByIndex = {};

      for (let idx = 0; idx < FISCAL_MONTH_SEQUENCE.length; idx++) {
        const { month, year } = FISCAL_MONTH_SEQUENCE[idx];
        const monthAchievements = [];

        for (const kv of kpiValues) {
          try {
            const resp = await api.get(`/kpi-values/${kv.id}/monthly-data/${year}`);
            const rows = resp.data?.data || [];
            const monthRow = rows.find(r => Number(r.month) === month && Number(r.year) === year);

            if (monthRow) {
              const target = Number(monthRow.target_value || 0);
              const actual = Number(monthRow.actual_value || 0);

              if (target > 0) {
                const achievement = Math.min(100, (actual / target) * 100);
                monthAchievements.push(achievement);
              }
            }
          } catch (err) {
            // Skip errors for individual KPI values
          }
        }

        if (monthAchievements.length > 0) {
          const avg = monthAchievements.reduce((a, b) => a + b, 0) / monthAchievements.length;
          efficiencyByIndex[idx] = Math.round(avg * 10) / 10;
        } else {
          efficiencyByIndex[idx] = 0;
        }
      }

      const monthly = FISCAL_MONTH_SEQUENCE.map((entry, idx) => ({
        month: entry.month,
        year: entry.year,
        efficiency: efficiencyByIndex[idx] || 0,
      }));

      setPlantEfficiency(efficiencyByIndex);
      setMonthlyEfficiency(monthly);
      setSelectedFiscalIndex(0);
    } catch (err) {
      console.error('Failed to load plant efficiency', err);
    } finally {
      setEfficiencyLoading(false);
    }
  };

  const loadGreenFactoryChart = async (lookupData = {}) => {
    try {
      setGreenFactoryLoading(true);
      const currentYear = new Date().getFullYear();

      const kpisRes = await api.get('/kpis');
      const kpis = kpisRes.data?.data || [];
      console.log('Searching for Green Factory KPI...');

      const greenKpis = kpis.filter(k => (k.title || '').toLowerCase().includes('green'));
      console.log('Found Green KPIs:', greenKpis.map(k => `${k.id}: ${k.title}`));
      
      if (!greenKpis || greenKpis.length === 0) {
        console.warn('Green Factory KPI not found');
        setGreenFactoryChart(null);
        return;
      }

      let greenFactoryValue = null;
      let selectedKpi = null;
      
      for (const kpi of greenKpis) {
        const valuesRes = await api.get(`/kpis/${kpi.id}/values`);
        const kpiValues = valuesRes.data?.data || [];
        console.log(`KPI ${kpi.id} (${kpi.title}) has ${kpiValues.length} values`);
        
        if (kpiValues && kpiValues.length > 0) {
          greenFactoryValue = kpiValues[0];
          selectedKpi = kpi;
          console.log(`Selected Green Factory KPI value: ${greenFactoryValue.id} from KPI ${kpi.id}`);
          break;
        }
      }
      
      if (!greenFactoryValue) {
        console.warn('No KPI values found for any Green KPI');
        setGreenFactoryChart(null);
        return;
      }

      // Fetch monthly data for all fiscal months
      const greenByMonth = [];
      for (let idx = 0; idx < FISCAL_MONTH_SEQUENCE.length; idx++) {
        const { month, year } = FISCAL_MONTH_SEQUENCE[idx];
        try {
          const resp = await api.get(`/kpi-values/${greenFactoryValue.id}/monthly-data/${year}`);
          const rows = resp.data?.data || [];
          const monthRow = rows.find(r => Number(r.month) === month && Number(r.year) === year);

          if (monthRow) {
            const actual = Number(monthRow.actual_value || 0);
            greenByMonth.push(actual);
          } else {
            greenByMonth.push(0);
          }
        } catch (err) {
          greenByMonth.push(0);
        }
      }

      const labels = FISCAL_MONTH_SEQUENCE.map(
        entry => `${MONTH_LABELS[entry.month - 1]} ${entry.year}`
      );

      setGreenFactoryChart({
        title: 'Environment',
        subtitle: 'Green Factory',
        labels,
        values: greenByMonth,
      });
    } catch (err) {
      console.error('Failed to load Green Factory chart', err);
      setGreenFactoryChart(null);
    } finally {
      setGreenFactoryLoading(false);
    }
  };

  const loadZeroAccidentsChart = async (lookupData = {}) => {
    try {
      setZeroAccidentsLoading(true);
      const currentYear = new Date().getFullYear();

      const kpisRes = await api.get('/kpis');
      const kpis = kpisRes.data?.data || [];
      console.log('Searching for Zero Accidents KPI...');

      const accidentKpis = kpis.filter(k => (k.title || '').toLowerCase().includes('accident'));
      console.log('Found Accident KPIs:', accidentKpis.map(k => `${k.id}: ${k.title}`));
      
      if (!accidentKpis || accidentKpis.length === 0) {
        console.warn('Zero Accidents KPI not found');
        setZeroAccidentsChart(null);
        return;
      }

      let accidentValue = null;
      
      for (const kpi of accidentKpis) {
        const valuesRes = await api.get(`/kpis/${kpi.id}/values`);
        const kpiValues = valuesRes.data?.data || [];
        console.log(`KPI ${kpi.id} (${kpi.title}) has ${kpiValues.length} values`);
        
        if (kpiValues && kpiValues.length > 0) {
          accidentValue = kpiValues[0];
          console.log(`Selected Zero Accidents KPI value: ${accidentValue.id} from KPI ${kpi.id}`);
          break;
        }
      }
      
      if (!accidentValue) {
        console.warn('No KPI values found for any Accident KPI');
        setZeroAccidentsChart(null);
        return;
      }

      // Fetch monthly data for all fiscal months
      const accidentsByMonth = [];
      for (let idx = 0; idx < FISCAL_MONTH_SEQUENCE.length; idx++) {
        const { month, year } = FISCAL_MONTH_SEQUENCE[idx];
        try {
          const resp = await api.get(`/kpi-values/${accidentValue.id}/monthly-data/${year}`);
          const rows = resp.data?.data || [];
          const monthRow = rows.find(r => Number(r.month) === month && Number(r.year) === year);

          if (monthRow) {
            const actual = Number(monthRow.actual_value || 0);
            const target = Number(monthRow.target_value || 0);
            accidentsByMonth.push({ actual, target });
          } else {
            accidentsByMonth.push({ actual: 0, target: 0 });
          }
        } catch (err) {
          accidentsByMonth.push({ actual: 0, target: 0 });
        }
      }

      const labels = FISCAL_MONTH_SEQUENCE.map(
        entry => `${MONTH_LABELS[entry.month - 1]} ${entry.year}`
      );

      const actuals = accidentsByMonth.map(d => d.actual);
      const targets = accidentsByMonth.map(d => d.target);

      setZeroAccidentsChart({
        title: 'Safety',
        subtitle: 'Zero Accidents',
        labels,
        actuals,
        targets,
      });
    } catch (err) {
      console.error('Failed to load Zero Accidents chart', err);
      setZeroAccidentsChart(null);
    } finally {
      setZeroAccidentsLoading(false);
    }
  };

  const loadOnTimeDeliveryChart = async () => {
    try {
      setOnTimeDeliveryLoading(true);

      const kpisRes = await api.get('/kpis');
      const kpis = kpisRes.data?.data || [];

      const normalizeTitle = (value) => (value || '').toLowerCase();
      const scoreDeliveryKpi = (title) => {
        const normalized = normalizeTitle(title);
        let score = 0;
        if (normalized.includes('on time')) score += 3;
        if (normalized.includes('delivery')) score += 2;
        if (normalized.includes('ontime')) score += 2;
        return score;
      };

      const deliveryKpis = kpis
        .filter(k => {
          const title = normalizeTitle(k.title);
          return title.includes('delivery') || title.includes('on time') || title.includes('ontime');
        })
        .sort((a, b) => scoreDeliveryKpi(b.title) - scoreDeliveryKpi(a.title));

      console.log('Found Delivery KPIs:', deliveryKpis.map(k => `${k.id}: ${k.title}`));

      if (!deliveryKpis.length) {
        console.warn('On Time Delivery KPI not found');
        setOnTimeDeliveryChart(null);
        return;
      }

      const fiscalYears = Array.from(new Set(FISCAL_MONTH_SEQUENCE.map(entry => entry.year)));
      let deliveryValue = null;
      let rowsByYear = null;

      for (const kpi of deliveryKpis) {
        const valuesRes = await api.get(`/kpis/${kpi.id}/values`);
        const kpiValues = valuesRes.data?.data || [];
        console.log(`KPI ${kpi.id} (${kpi.title}) has ${kpiValues.length} values`);

        for (const candidateValue of kpiValues) {
          const candidateRowsByYear = {};
          let hasData = false;

          for (const year of fiscalYears) {
            try {
              const resp = await api.get(`/kpi-values/${candidateValue.id}/monthly-data/${year}`);
              const rows = resp.data?.data || [];
              candidateRowsByYear[year] = rows;
              if (rows.length > 0) {
                hasData = true;
              }
            } catch (err) {
              candidateRowsByYear[year] = [];
            }
          }

          if (hasData) {
            deliveryValue = candidateValue;
            rowsByYear = candidateRowsByYear;
            console.log(`Selected Delivery KPI value: ${deliveryValue.id} from KPI ${kpi.id}`);
            break;
          }
        }

        if (deliveryValue) {
          break;
        }
      }

      if (!deliveryValue) {
        console.warn('No KPI values found for any Delivery KPI');
        setOnTimeDeliveryChart(null);
        return;
      }

      const deliveryByMonth = [];
      for (let idx = 0; idx < FISCAL_MONTH_SEQUENCE.length; idx++) {
        const { month, year } = FISCAL_MONTH_SEQUENCE[idx];
        const rows = rowsByYear?.[year] || [];
        const monthRow = rows.find(r => Number(r.month) === month && Number(r.year) === year);

        if (monthRow) {
          const actual = Number(monthRow.actual_value || 0);
          const target = Number(monthRow.target_value || 0);
          deliveryByMonth.push({ actual, target });
        } else {
          deliveryByMonth.push({ actual: 0, target: 0 });
        }
      }

      const labels = FISCAL_MONTH_SEQUENCE.map(
        entry => `${MONTH_LABELS[entry.month - 1]} ${entry.year}`
      );
      const actuals = deliveryByMonth.map(d => d.actual);
      const targets = deliveryByMonth.map(d => d.target);

      setOnTimeDeliveryChart({
        title: 'On Time Delivery',
        subtitle: 'Target vs Achieved',
        labels,
        actuals,
        targets,
      });
    } catch (err) {
      console.error('Failed to load On Time Delivery chart', err);
      setOnTimeDeliveryChart(null);
    } finally {
      setOnTimeDeliveryLoading(false);
    }
  };

  const loadThemeChart = async () => {
    try {
      setThemeChartLoading(true);

      const kpisRes = await api.get('/kpis');
      const kpis = kpisRes.data?.data || [];

      const normalizeTitle = (value) => (value || '').toLowerCase();
      const scoreThemeKpi = (title) => {
        const normalized = normalizeTitle(title);
        let score = 0;
        if (normalized.includes('theme')) score += 3;
        if (normalized.includes('unlock')) score += 2;
        if (normalized.includes('power') || normalized.includes('you')) score += 1;
        return score;
      };

      const themeKpis = kpis
        .filter(k => {
          const title = normalizeTitle(k.title);
          return title.includes('theme') || (title.includes('unlock') && title.includes('power')) || (title.includes('2025') && title.includes('2026'));
        })
        .sort((a, b) => scoreThemeKpi(b.title) - scoreThemeKpi(a.title));

      console.log('Found Theme KPIs:', themeKpis.map(k => `${k.id}: ${k.title}`));

      if (!themeKpis.length) {
        console.warn('Theme of the Year KPI not found');
        setThemeChart(null);
        return;
      }

      let themeValue = null;

      for (const kpi of themeKpis) {
        const valuesRes = await api.get(`/kpis/${kpi.id}/values`);
        const kpiValues = valuesRes.data?.data || [];
        console.log(`KPI ${kpi.id} (${kpi.title}) has ${kpiValues.length} values`);

        if (kpiValues.length > 0) {
          themeValue = kpiValues[0];
          console.log(`Selected Theme KPI value: ${themeValue.id} from KPI ${kpi.id}`);
          break;
        }
      }

      if (!themeValue) {
        console.warn('No KPI values found for any Theme KPI');
        setThemeChart(null);
        return;
      }

      const themeByMonth = [];
      const fiscalYears = Array.from(new Set(FISCAL_MONTH_SEQUENCE.map(entry => entry.year)));
      const rowsByYear = {};
      
      for (const year of fiscalYears) {
        try {
          const resp = await api.get(`/kpi-values/${themeValue.id}/monthly-data/${year}`);
          rowsByYear[year] = resp.data?.data || [];
        } catch (err) {
          rowsByYear[year] = [];
        }
      }

      for (let idx = 0; idx < FISCAL_MONTH_SEQUENCE.length; idx++) {
        const { month, year } = FISCAL_MONTH_SEQUENCE[idx];
        const rows = rowsByYear[year] || [];
        const monthRow = rows.find(r => Number(r.month) === month && Number(r.year) === year);

        if (monthRow) {
          const value = Number(monthRow.actual_value || 0);
          themeByMonth.push(value);
        } else {
          themeByMonth.push(0);
        }
      }

      const labels = FISCAL_MONTH_SEQUENCE.map(
        entry => `${MONTH_LABELS[entry.month - 1]} ${entry.year}`
      );

      setThemeChart({
        title: 'Theme Of The Year 2025-26',
        subtitle: 'Unlock The Power of You',
        labels,
        values: themeByMonth,
      });
    } catch (err) {
      console.error('Failed to load Theme chart', err);
    } finally {
      setThemeChartLoading(false);
    }
  };

  const loadEmployeesChart = async () => {
    try {
      setEmployeesChartLoading(true);

      const kpisRes = await api.get('/kpis');
      const kpis = kpisRes.data?.data || [];

      const normalizeTitle = (value) => (value || '').toLowerCase();
      const scoreEmployeeKpi = (title) => {
        const normalized = normalizeTitle(title);
        let score = 0;
        if (normalized.includes('employee') || normalized.includes('employees')) score += 3;
        if (normalized.includes('left') || normalized.includes('attrition')) score += 2;
        return score;
      };

      const employeeKpis = kpis
        .filter(k => {
          const title = normalizeTitle(k.title);
          return (title.includes('employee') || title.includes('employees')) && (title.includes('left') || title.includes('attrition'));
        })
        .sort((a, b) => scoreEmployeeKpi(b.title) - scoreEmployeeKpi(a.title));

      console.log('Found Employee Left KPIs:', employeeKpis.map(k => `${k.id}: ${k.title}`));

      if (!employeeKpis.length) {
        console.warn('Employees Left KPI not found');
        setEmployeesChart(null);
        return;
      }

      let employeeValue = null;

      for (const kpi of employeeKpis) {
        const valuesRes = await api.get(`/kpis/${kpi.id}/values`);
        const kpiValues = valuesRes.data?.data || [];
        console.log(`KPI ${kpi.id} (${kpi.title}) has ${kpiValues.length} values`);

        if (kpiValues.length > 0) {
          employeeValue = kpiValues[0];
          console.log(`Selected Employee Left KPI value: ${employeeValue.id} from KPI ${kpi.id}`);
          break;
        }
      }

      if (!employeeValue) {
        console.warn('No KPI values found for any Employee Left KPI');
        setEmployeesChart(null);
        return;
      }

      const employeesByMonth = [];
      const fiscalYears = Array.from(new Set(FISCAL_MONTH_SEQUENCE.map(entry => entry.year)));
      const rowsByYear = {};
      
      for (const year of fiscalYears) {
        try {
          const resp = await api.get(`/kpi-values/${employeeValue.id}/monthly-data/${year}`);
          rowsByYear[year] = resp.data?.data || [];
        } catch (err) {
          rowsByYear[year] = [];
        }
      }

      for (let idx = 0; idx < FISCAL_MONTH_SEQUENCE.length; idx++) {
        const { month, year } = FISCAL_MONTH_SEQUENCE[idx];
        const rows = rowsByYear[year] || [];
        const monthRow = rows.find(r => Number(r.month) === month && Number(r.year) === year);

        if (monthRow) {
          const value = Number(monthRow.actual_value || 0);
          employeesByMonth.push(value);
        } else {
          employeesByMonth.push(0);
        }
      }

      const labels = FISCAL_MONTH_SEQUENCE.map(
        entry => `${MONTH_LABELS[entry.month - 1]} ${entry.year}`
      );

      setEmployeesChart({
        title: 'No. of Employees Who Left',
        subtitle: 'Monthly Attrition',
        labels,
        values: employeesByMonth,
      });
    } catch (err) {
      console.error('Failed to load Employees chart', err);
      setEmployeesChart(null);
    } finally {
      setEmployeesChartLoading(false);
    }
  };

  const loadIndustry40Chart = async (lookupData = {}) => {
    try {
      setIndustry40Loading(true);
      const currentYear = new Date().getFullYear();

      const kpisRes = await api.get('/kpis');
      const kpis = kpisRes.data?.data || [];
      console.log('All KPIs:', kpis.map(k => `${k.id}: ${k.title}`));

      const industryKpis = kpis.filter(k => (k.title || '').toLowerCase().includes('industry'));
      console.log('Found Industry KPIs:', industryKpis.map(k => `${k.id}: ${k.title}`));
      
      if (!industryKpis || industryKpis.length === 0) {
        console.warn('Industry 4.0 KPI not found. Available KPIs:', kpis.map(k => k.title));
        setIndustry40Chart(null);
        return;
      }

      // Try each industry KPI to find one with data
      let industry40Value = null;
      let selectedKpi = null;
      
      for (const kpi of industryKpis) {
        const valuesRes = await api.get(`/kpis/${kpi.id}/values`);
        const kpiValues = valuesRes.data?.data || [];
        console.log(`KPI ${kpi.id} (${kpi.title}) has ${kpiValues.length} values`);
        
        if (kpiValues && kpiValues.length > 0) {
          industry40Value = kpiValues[0];
          selectedKpi = kpi;
          console.log(`Selected KPI value: ${industry40Value.id} from KPI ${kpi.id}`);
          break;
        }
      }
      
      if (!industry40Value) {
        console.warn('No KPI values found for any Industry KPI');
        setIndustry40Chart(null);
        return;
      }

      const fiscalYears = Array.from(new Set(FISCAL_MONTH_SEQUENCE.map(entry => entry.year)));
      const rowsByYear = {};

      for (const year of fiscalYears) {
        try {
          const resp = await api.get(`/kpi-values/${industry40Value.id}/monthly-data/${year}`);
          rowsByYear[year] = resp.data?.data || [];
          console.log(`Fetched Industry40 data for year ${year}: ${rowsByYear[year].length} rows`);
        } catch (err) {
          console.warn(`Failed to fetch Industry40 data for year ${year}:`, err.message);
          rowsByYear[year] = [];
        }
      }

      const byYearMonth = Object.entries(rowsByYear).reduce((acc, [year, rows]) => {
        rows.forEach((row) => {
          const key = `${year}-${Number(row.month)}`;
          acc[key] = row;
        });
        return acc;
      }, {});

      const labels = FISCAL_MONTH_SEQUENCE.map(
        entry => `${MONTH_LABELS[entry.month - 1]} ${entry.year}`
      );
      const actuals = FISCAL_MONTH_SEQUENCE.map((entry) => {
        const row = byYearMonth[`${entry.year}-${entry.month}`];
        return Number(row?.actual_value || 0);
      });
      const targets = FISCAL_MONTH_SEQUENCE.map((entry) => {
        const row = byYearMonth[`${entry.year}-${entry.month}`];
        return Number(row?.target_value || 0);
      });

      const displayYear = `${FISCAL_YEAR_START}-${FISCAL_YEAR_START + 1}`;

      setIndustry40Chart({
        title: `Industry 4.0 Performance Trend (${displayYear})`,
        labels,
        actuals,
        targets,
      });
    } catch (err) {
      console.error('Failed to load Industry 4.0 chart', err);
      setIndustry40Chart(null);
    } finally {
      setIndustry40Loading(false);
    }
  };

  const loadZeroQualityChart = async () => {
    try {
      setZeroQualityLoading(true);

      const kpisRes = await api.get('/kpis');
      const kpis = kpisRes.data?.data || [];

      const normalizeTitle = (value) => (value || '').toLowerCase();
      const scoreQualityKpi = (title) => {
        const normalized = normalizeTitle(title);
        let score = 0;
        if (normalized.includes('zero quality')) score += 3;
        if (normalized.includes('complaint')) score += 2;
        if (normalized.includes('customer')) score += 1;
        if (normalized.includes('quality')) score += 1;
        return score;
      };

      const qualityKpis = kpis
        .filter(k => {
          const title = normalizeTitle(k.title);
          return title.includes('quality') || title.includes('complaint') || title.includes('customer');
        })
        .sort((a, b) => scoreQualityKpi(b.title) - scoreQualityKpi(a.title));

      console.log('Found Quality KPIs:', qualityKpis.map(k => `${k.id}: ${k.title}`));

      if (!qualityKpis.length) {
        console.warn('Zero Quality Complaints KPI not found');
        setZeroQualityChart(null);
        return;
      }

      let zeroQualityValue = null;

      for (const kpi of qualityKpis) {
        const valuesRes = await api.get(`/kpis/${kpi.id}/values`);
        const kpiValues = valuesRes.data?.data || [];
        console.log(`KPI ${kpi.id} (${kpi.title}) has ${kpiValues.length} values`);

        if (kpiValues.length > 0) {
          zeroQualityValue = kpiValues[0];
          console.log(`Selected KPI value: ${zeroQualityValue.id} from KPI ${kpi.id}`);
          break;
        }
      }

      if (!zeroQualityValue) {
        console.warn('No KPI values found for any Quality KPI');
        setZeroQualityChart(null);
        return;
      }

      const qualityByMonth = [];
      for (let idx = 0; idx < FISCAL_MONTH_SEQUENCE.length; idx++) {
        const { month, year } = FISCAL_MONTH_SEQUENCE[idx];
        try {
          const resp = await api.get(`/kpi-values/${zeroQualityValue.id}/monthly-data/${year}`);
          const rows = resp.data?.data || [];
          const monthRow = rows.find(r => Number(r.month) === month && Number(r.year) === year);

          if (monthRow) {
            const actual = Number(monthRow.actual_value || 0);
            const target = Number(monthRow.target_value || 0);
            qualityByMonth.push({ actual, target });
          } else {
            qualityByMonth.push({ actual: 0, target: 0 });
          }
        } catch (err) {
          qualityByMonth.push({ actual: 0, target: 0 });
        }
      }

      const labels = FISCAL_MONTH_SEQUENCE.map(
        entry => `${MONTH_LABELS[entry.month - 1]} ${entry.year}`
      );
      const actuals = qualityByMonth.map(d => d.actual);
      const targets = qualityByMonth.map(d => d.target);

      setZeroQualityChart({
        title: 'Zero Quality Complaints',
        labels,
        actuals,
        targets,
      });
    } catch (err) {
      console.error('Failed to load Zero Quality Complaints chart', err);
      setZeroQualityChart(null);
    } finally {
      setZeroQualityLoading(false);
    }
  };

  const loadSalesChart = async () => {
    try {
      setSalesLoading(true);

      const kpisRes = await api.get('/kpis');
      const kpis = kpisRes.data?.data || [];
      console.log('Available KPIs for Sales:', kpis.map(k => `${k.id}: ${k.title}`));

      const salesKpis = kpis.filter(k => 
        (k.title || '').toLowerCase().includes('sales') || 
        (k.title || '').toLowerCase().includes('revenue')
      );
      console.log('Found Sales KPIs:', salesKpis.map(k => `${k.id}: ${k.title}`));
      
      if (!salesKpis || salesKpis.length === 0) {
        console.warn('Sales/Revenue KPI not found');
        setMonthlySalesData([]);
        return;
      }

      let salesValue = null;
      let selectedKpi = null;
      
      for (const kpi of salesKpis) {
        const valuesRes = await api.get(`/kpis/${kpi.id}/values`);
        const kpiValues = valuesRes.data?.data || [];
        console.log(`KPI ${kpi.id} (${kpi.title}) has ${kpiValues.length} values`);
        
        if (kpiValues && kpiValues.length > 0) {
          salesValue = kpiValues[0];
          selectedKpi = kpi;
          console.log(`Selected KPI value: ${salesValue.id} from KPI ${kpi.id}`);
          break;
        }
      }
      
      if (!salesValue) {
        console.warn('No KPI values found for any Sales KPI');
        setMonthlySalesData([]);
        return;
      }

      const salesByMonth = [];
      for (let idx = 0; idx < FISCAL_MONTH_SEQUENCE.length; idx++) {
        const { month, year } = FISCAL_MONTH_SEQUENCE[idx];
        try {
          const resp = await api.get(`/kpi-values/${salesValue.id}/monthly-data/${year}`);
          const rows = resp.data?.data || [];
          const monthRow = rows.find(r => Number(r.month) === month && Number(r.year) === year);

          if (monthRow) {
            const target = Number(monthRow.target_value || 0);
            const actual = Number(monthRow.actual_value || 0);
            salesByMonth.push({ month, year, actual, target });
          } else {
            salesByMonth.push({ month, year, actual: 0, target: 0 });
          }
        } catch (err) {
          salesByMonth.push({ month, year, actual: 0, target: 0 });
        }
      }

      setMonthlySalesData(salesByMonth);
      setSelectedSalesIndex(0);
    } catch (err) {
      console.error('Failed to load Sales data', err);
      setMonthlySalesData([]);
    } finally {
      setSalesLoading(false);
    }
  };

  const loadProfitabilityData = async () => {
    try {
      setProfitabilityLoading(true);

      const kpisRes = await api.get('/kpis');
      const kpis = kpisRes.data?.data || [];
      console.log('Available KPIs for Profitability:', kpis.map(k => `${k.id}: ${k.title}`));

      const profitKpis = kpis.filter(k => 
        (k.title || '').toLowerCase().includes('profit') || 
        (k.title || '').toLowerCase().includes('pl')
      );
      console.log('Found Profit KPIs:', profitKpis.map(k => `${k.id}: ${k.title}`));
      
      if (!profitKpis || profitKpis.length === 0) {
        console.warn('Profitability KPI not found');
        setMonthlyProfitData([]);
        return;
      }

      let profitValue = null;
      let selectedKpi = null;
      
      for (const kpi of profitKpis) {
        const valuesRes = await api.get(`/kpis/${kpi.id}/values`);
        const kpiValues = valuesRes.data?.data || [];
        console.log(`KPI ${kpi.id} (${kpi.title}) has ${kpiValues.length} values`);
        
        if (kpiValues && kpiValues.length > 0) {
          profitValue = kpiValues[0];
          selectedKpi = kpi;
          console.log(`Selected KPI value: ${profitValue.id} from KPI ${kpi.id}`);
          break;
        }
      }
      
      if (!profitValue) {
        console.warn('No KPI values found for any Profit KPI');
        setMonthlyProfitData([]);
        return;
      }

      const profitByMonth = [];
      for (let idx = 0; idx < FISCAL_MONTH_SEQUENCE.length; idx++) {
        const { month, year } = FISCAL_MONTH_SEQUENCE[idx];
        try {
          const resp = await api.get(`/kpi-values/${profitValue.id}/monthly-data/${year}`);
          const rows = resp.data?.data || [];
          const monthRow = rows.find(r => Number(r.month) === month && Number(r.year) === year);

          if (monthRow) {
            const profit = Number(monthRow.actual_value || 0);
            const target = Number(monthRow.target_value || 100);
            profitByMonth.push({ month, year, profit, target });
          } else {
            profitByMonth.push({ month, year, profit: 0, target: 100 });
          }
        } catch (err) {
          profitByMonth.push({ month, year, profit: 0, target: 100 });
        }
      }

      setMonthlyProfitData(profitByMonth);
      setSelectedProfitIndex(0);
    } catch (err) {
      console.error('Failed to load Profitability data', err);
      setMonthlyProfitData([]);
    } finally {
      setProfitabilityLoading(false);
    }
  };

  const loadKpiCharts = async (lookup = kpiLookup) => {
    try {
      setChartsLoading(true);
      const currentYear = new Date().getFullYear();
      const kpiValuesRes = await api.get('/kpi-values');
      const kpiValues = (kpiValuesRes.data?.data || []).slice(0, 12); // limit upfront to cut payload size

      // Build up to 4 charts that actually have data (skip empty ones)
      const charts = [];
      for (const kv of kpiValues) {
        if (charts.length >= 4) break; // cap to avoid heavy load
        try {
          const resp = await api.get(`/kpi-values/${kv.id}/monthly-data/${currentYear}`);
          const rows = resp.data?.data || [];
          if (!rows.length) continue;

          const labels = rows.map(r => {
            const monthLabel = MONTH_LABELS[(Number(r.month) || 1) - 1] || `M${r.month}`;
            return `${monthLabel} ${r.year || currentYear}`;
          });
          const actuals = rows.map(r => Number(r.actual_value || 0));
          const targets = rows.map(r => Number(r.target_value || 0));

          charts.push({
            id: kv.id,
            title: lookup?.[kv.kpi_id] || kv.data || `KPI ${kv.kpi_id || kv.id}`,
            labels,
            actuals,
            targets,
          });
        } catch (err) {
          console.error('Failed to load monthly data for KPI value', kv.id, err);
        }
      }

      setKpiCharts(charts);
    } catch (err) {
      console.error('Failed to load KPI charts', err);
      setKpiCharts([]);
    } finally {
      setChartsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      authService.removeToken();
      localStorage.removeItem('user');
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      authService.removeToken();
      localStorage.removeItem('user');
      navigate('/login');
    }
  };
  const openExpandedChart = (chartType, data) => {
    setExpandedChart(chartType);
    setExpandedChartData(data);
  };

  const closeExpandedChart = () => {
    setExpandedChart(null);
    setExpandedChartData(null);
  };

  const getUserDisplayName = () => {
    if (!user) return 'User';
    return `${user.firstname} ${user.lastname}`;
  };

  return (
    <div className="dashboard-layout">
      <header className="header">
        <div className="header-content">
          <button className="menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
            ☰
          </button>
          <div className="header-logo-section">
            <img src="/hyloc-logo.png" alt="Hyloc Logo" className="header-logo" />
            <h1 className="header-title">Hyloc Hydrotechnic Pvt Ltd.</h1>
          </div>
          <div className="header-actions">
            <div className="user-profile" ref={dropdownRef}>
              <button className="profile-button" onClick={() => setDropdownOpen(!dropdownOpen)}>
                <span className="profile-icon">👤</span>
                <span className="profile-name">{getUserDisplayName()}</span>
                <span className="dropdown-arrow">{dropdownOpen ? '▲' : '▼'}</span>
              </button>
              
              {dropdownOpen && (
                <div className="dropdown-menu">
                  <div className="dropdown-header">
                    <div className="dropdown-user-icon">👤</div>
                    <div className="dropdown-user-info">
                      <div className="dropdown-user-name">{getUserDisplayName()}</div>
                      <div className="dropdown-user-email">{user?.email || ''}</div>
                    </div>
                  </div>
                  <div className="dropdown-divider"></div>
                  <button className="dropdown-item" onClick={() => { setDropdownOpen(false); navigate('/profile'); }}>
                    <span className="dropdown-item-icon">👤</span>
                    View Profile
                  </button>
                  <button className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                    <span className="dropdown-item-icon">⚙️</span>
                    Settings
                  </button>
                  <div className="dropdown-divider"></div>
                  <button className="dropdown-item logout" onClick={handleLogout}>
                    <span className="dropdown-item-icon">🚪</span>
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="main-container">
        <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
          <nav className="sidebar-nav">
            {menuItems.map((item) => (
              <a
                key={item.id}
                href={item.path}
                className={`nav-item ${item.id === 1 ? 'active' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  navigate(item.path);
                }}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </a>
            ))}
          </nav>
        </aside>

        <main className={`content ${sidebarOpen ? 'expanded' : 'full'}`}>
          <div className="page-header">
            <h2>Dashboard</h2>
            <p className="subtitle">Welcome back, {getUserDisplayName()}</p>
          </div>

          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">📈</div>
              <div className="stat-content">
                <h3 className="stat-value">{stats.totalKPIs}</h3>
                <p className="stat-label">Total KPIs</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">✅</div>
              <div className="stat-content">
                <h3 className="stat-value">{stats.activeKPIs}</h3>
                <p className="stat-label">Active KPIs</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">🏛️</div>
              <div className="stat-content">
                <h3 className="stat-value">{stats.totalPillars}</h3>
                <p className="stat-label">Total Pillars</p>
              </div>
            </div>
          </div>

          <div className="dashboard-content">
            <div className="welcome-section">
              <h3>📊 Your Performance Dashboard</h3>
              <p>Track your KPIs and performance metrics here. Use the sidebar to navigate to KMIs and Pillars sections.</p>
            </div>

            <div className="dashboard-four-grid">
              <div className="dashboard-grid-item">
                <div
                  className="chart-card clickable"
                  onClick={() => openExpandedChart('plantEfficiency', { monthlyEfficiency, selectedFiscalIndex })}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && openExpandedChart('plantEfficiency', { monthlyEfficiency, selectedFiscalIndex })}
                >
                  <h3 className="chart-card-title">⚡ Plant Efficiency</h3>
                  {efficiencyLoading ? (
                    <div className="loading">Loading...</div>
                  ) : (
                    <div className="speedometer-compact">
                      <button 
                        className="nav-arrow-compact prev"
                          onClick={(e) => {
                            e.stopPropagation();
                          if (!monthlyEfficiency.length) return;
                          setSelectedFiscalIndex(selectedFiscalIndex === 0 ? monthlyEfficiency.length - 1 : selectedFiscalIndex - 1);
                        }}
                        disabled={!monthlyEfficiency.length}
                      >
                        ‹
                      </button>
                      
                      <SpeedometerGauge 
                        efficiency={monthlyEfficiency[selectedFiscalIndex]?.efficiency || 0}
                        month={MONTH_LABELS[(monthlyEfficiency[selectedFiscalIndex]?.month || 1) - 1]}
                        year={monthlyEfficiency[selectedFiscalIndex]?.year || ''}
                      />

                      <button 
                        className="nav-arrow-compact next"
                          onClick={(e) => {
                            e.stopPropagation();
                          if (!monthlyEfficiency.length) return;
                          setSelectedFiscalIndex(selectedFiscalIndex === monthlyEfficiency.length - 1 ? monthlyEfficiency.length - 1 : selectedFiscalIndex + 1);
                        }}
                        disabled={!monthlyEfficiency.length || selectedFiscalIndex >= monthlyEfficiency.length - 1}
                      >
                        ›
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="dashboard-grid-item">
                <div
                  className="chart-card clickable"
                  onClick={() => openExpandedChart(
                    'industry40',
                    industry40Chart || {
                      title: 'Industry 4.0 Performance',
                      labels: FISCAL_MONTH_SEQUENCE.map(
                        entry => `${MONTH_LABELS[entry.month - 1]} ${entry.year}`
                      ),
                      actuals: Array(12).fill(0),
                      targets: Array(12).fill(0)
                    }
                  )}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && openExpandedChart(
                    'industry40',
                    industry40Chart || {
                      title: 'Industry 4.0 Performance',
                      labels: FISCAL_MONTH_SEQUENCE.map(
                        entry => `${MONTH_LABELS[entry.month - 1]} ${entry.year}`
                      ),
                      actuals: Array(12).fill(0),
                      targets: Array(12).fill(0)
                    }
                  )}
                >
                  {industry40Loading ? (
                    <div className="loading">Loading...</div>
                  ) : industry40Chart ? (
                    <Industry40LineChart
                      title={industry40Chart.title}
                      labels={industry40Chart.labels}
                      actuals={industry40Chart.actuals}
                      targets={industry40Chart.targets}
                      showAxisLabels={true}
                      showPointLabels={true}
                    />
                  ) : (
                    <Industry40LineChart
                      title="Industry 4.0 Performance"
                      labels={FISCAL_MONTH_SEQUENCE.map(
                        entry => `${MONTH_LABELS[entry.month - 1]} ${entry.year}`
                      )}
                      actuals={Array(12).fill(0)}
                      targets={Array(12).fill(0)}
                      showAxisLabels={true}
                      showPointLabels={true}
                    />
                  )}
                </div>
              </div>

              <div className="dashboard-grid-item">
                <div
                  className="chart-card clickable"
                  onClick={() => openExpandedChart(
                    'zeroQuality',
                    zeroQualityChart || {
                      title: 'Zero Quality Complaints',
                      labels: FISCAL_MONTH_SEQUENCE.map(
                        entry => `${MONTH_LABELS[entry.month - 1]} ${entry.year}`
                      ),
                      actuals: Array(12).fill(0),
                      targets: Array(12).fill(0)
                    }
                  )}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && openExpandedChart(
                    'zeroQuality',
                    zeroQualityChart || {
                      title: 'Zero Quality Complaints',
                      labels: FISCAL_MONTH_SEQUENCE.map(
                        entry => `${MONTH_LABELS[entry.month - 1]} ${entry.year}`
                      ),
                      actuals: Array(12).fill(0),
                      targets: Array(12).fill(0)
                    }
                  )}
                >
                  {zeroQualityLoading ? (
                    <div className="loading">Loading...</div>
                  ) : zeroQualityChart ? (
                    <Industry40LineChart
                      title={zeroQualityChart.title}
                      labels={zeroQualityChart.labels}
                      actuals={zeroQualityChart.actuals}
                      targets={zeroQualityChart.targets}
                      showAxisLabels={true}
                      showPointLabels={true}
                    />
                  ) : (
                    <Industry40LineChart
                      title="Zero Quality Complaints"
                      labels={FISCAL_MONTH_SEQUENCE.map(
                        entry => `${MONTH_LABELS[entry.month - 1]} ${entry.year}`
                      )}
                      actuals={Array(12).fill(0)}
                      targets={Array(12).fill(0)}
                      showAxisLabels={true}
                      showPointLabels={true}
                    />
                  )}
                </div>
              </div>

              <div className="dashboard-grid-item">
                <div
                  className="chart-card-split clickable cost-split-card"
                  onClick={() => openExpandedChart('salesProfit', { monthlySalesData, selectedSalesIndex, monthlyProfitData, selectedProfitIndex })}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && openExpandedChart('salesProfit', { monthlySalesData, selectedSalesIndex, monthlyProfitData, selectedProfitIndex })}
                >
                  <div className="split-card-heading">
                    <h4 className="split-card-title">COST</h4>
                  </div>
                  <div className="split-card-body">
                    <div className="split-section">
                      <div className="split-section-heading">
                        <h5 className="split-section-subtitle">REVENUE</h5>
                      </div>
                    {salesLoading ? (
                      <div className="loading">Loading...</div>
                    ) : (
                      <div className="pie-chart-with-nav">
                        <button 
                          className="nav-arrow-compact prev"
                            onClick={(e) => {
                              e.stopPropagation();
                            if (!monthlySalesData.length) return;
                            setSelectedSalesIndex(selectedSalesIndex === 0 ? monthlySalesData.length - 1 : selectedSalesIndex - 1);
                          }}
                          disabled={!monthlySalesData.length}
                        >
                          ‹
                        </button>
                        
                        <div className="pie-chart-display">
                          <h5 className="pie-month-title">
                            {MONTH_LABELS[(monthlySalesData[selectedSalesIndex]?.month || 1) - 1]} {monthlySalesData[selectedSalesIndex]?.year || ''}
                          </h5>
                          <svg viewBox="0 0 200 200" className="profit-pie-svg">
                            {(() => {
                              const salesData = monthlySalesData[selectedSalesIndex] || { actual: 0, target: 0 };
                              const radius = 70;
                              const cx = 100;
                              const cy = 100;
                              const sales = Math.max(0, salesData.actual || 0);
                              const targetSales = Math.max(0, salesData.target || 0);
                              const total = sales + targetSales || 100;
                              
                              // Fixed colors: Blue for sales, Orange for target
                              const salesColor = '#3b82f6';
                              const targetColor = '#f59e0b';
                              
                              // Calculate angles for sales and target
                              const salesAngle = (sales / total) * 360;
                              const targetAngle = (targetSales / total) * 360;
                              
                              const salesRadians = (salesAngle * Math.PI) / 180;
                              const targetRadians = (targetAngle * Math.PI) / 180;
                              
                              // Starting point
                              const x1 = cx + radius * Math.cos(-Math.PI / 2);
                              const y1 = cy + radius * Math.sin(-Math.PI / 2);
                              
                              // Sales segment end
                              const x2 = cx + radius * Math.cos(-Math.PI / 2 + salesRadians);
                              const y2 = cy + radius * Math.sin(-Math.PI / 2 + salesRadians);
                              
                              // Target segment end
                              const x3 = cx + radius * Math.cos(-Math.PI / 2 + salesRadians + targetRadians);
                              const y3 = cy + radius * Math.sin(-Math.PI / 2 + salesRadians + targetRadians);
                              
                              const salesLargeArc = salesAngle > 180 ? 1 : 0;
                              const targetLargeArc = targetAngle > 180 ? 1 : 0;
                              
                              // Calculate midpoint for sales label
                              const salesMidAngle = -Math.PI / 2 + (salesRadians / 2);
                              const salesLabelX = cx + (radius * 0.65) * Math.cos(salesMidAngle);
                              const salesLabelY = cy + (radius * 0.65) * Math.sin(salesMidAngle);
                              
                              // Calculate midpoint for target label
                              const targetMidAngle = -Math.PI / 2 + salesRadians + (targetRadians / 2);
                              const targetLabelX = cx + (radius * 0.65) * Math.cos(targetMidAngle);
                              const targetLabelY = cy + (radius * 0.65) * Math.sin(targetMidAngle);
                              
                              return (
                                <>
                                  {sales > 0 && (
                                    <path
                                      d={`M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${salesLargeArc} 1 ${x2} ${y2} Z`}
                                      fill={salesColor}
                                      stroke="white"
                                      strokeWidth="2"
                                    />
                                  )}
                                  
                                  {targetSales > 0 && (
                                    <path
                                      d={`M ${cx} ${cy} L ${x2} ${y2} A ${radius} ${radius} 0 ${targetLargeArc} 1 ${x3} ${y3} Z`}
                                      fill={targetColor}
                                      stroke="white"
                                      strokeWidth="2"
                                    />
                                  )}
                                  
                                  {sales > 0 && (
                                    <text x={salesLabelX} y={salesLabelY} textAnchor="middle" fontSize="12" fontWeight="700" fill="white">
                                      {sales.toFixed(0)}
                                    </text>
                                  )}
                                  
                                  {targetSales > 0 && (
                                    <text x={targetLabelX} y={targetLabelY} textAnchor="middle" fontSize="12" fontWeight="700" fill="white">
                                      {targetSales.toFixed(0)}
                                    </text>
                                  )}
                                </>
                              );
                            })()}
                          </svg>
                          
                          <div className="pie-legend-compact">
                            <div className="pie-legend-item">
                              <span className="pie-legend-color" style={{backgroundColor: '#3b82f6'}}></span>
                              <span className="pie-legend-label">Sales: {(monthlySalesData[selectedSalesIndex]?.actual || 0).toFixed(0)}</span>
                            </div>
                            <div className="pie-legend-item">
                              <span className="pie-legend-color" style={{backgroundColor: '#f59e0b'}}></span>
                              <span className="pie-legend-label">Target Sales: {(monthlySalesData[selectedSalesIndex]?.target || 0).toFixed(0)}</span>
                            </div>
                          </div>
                        </div>

                        <button 
                          className="nav-arrow-compact next"
                            onClick={(e) => {
                              e.stopPropagation();
                            if (!monthlySalesData.length) return;
                            setSelectedSalesIndex(selectedSalesIndex === monthlySalesData.length - 1 ? monthlySalesData.length - 1 : selectedSalesIndex + 1);
                          }}
                          disabled={!monthlySalesData.length || selectedSalesIndex >= monthlySalesData.length - 1}
                        >
                          ›
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="split-divider"></div>

                  <div className="split-section">
                    <div className="split-section-heading">
                      <h5 className="split-section-subtitle">PROFITABILITY (YTD)</h5>
                    </div>
                    {profitabilityLoading ? (
                      <div className="loading">Loading...</div>
                    ) : (
                      <div className="pie-chart-with-nav">
                        <button 
                          className="nav-arrow-compact prev"
                            onClick={(e) => {
                              e.stopPropagation();
                            if (!monthlyProfitData.length) return;
                            setSelectedProfitIndex(selectedProfitIndex === 0 ? monthlyProfitData.length - 1 : selectedProfitIndex - 1);
                          }}
                          disabled={!monthlyProfitData.length}
                        >
                          ‹
                        </button>
                        
                        <div className="pie-chart-display">
                          <h5 className="pie-month-title">
                            {MONTH_LABELS[(monthlyProfitData[selectedProfitIndex]?.month || 1) - 1]} {monthlyProfitData[selectedProfitIndex]?.year || ''}
                          </h5>
                          <svg viewBox="0 0 200 200" className="profit-pie-svg">
                            {(() => {
                              const profitData = monthlyProfitData[selectedProfitIndex] || { profit: 0, target: 100 };
                              const radius = 70;
                              const cx = 100;
                              const cy = 100;
                              const profit = profitData.profit;
                              const target = profitData.target;
                              const achieved = Math.min(profit, target);
                              const remaining = Math.max(0, target - profit);
                              const total = achieved + remaining;
                              
                              const achievedAngle = (achieved / total) * 360;
                              const achievedRadians = (achievedAngle * Math.PI) / 180;
                              
                              const x1 = cx + radius * Math.cos(-Math.PI / 2);
                              const y1 = cy + radius * Math.sin(-Math.PI / 2);
                              const x2 = cx + radius * Math.cos(-Math.PI / 2 + achievedRadians);
                              const y2 = cy + radius * Math.sin(-Math.PI / 2 + achievedRadians);
                              
                              const largeArc = achievedAngle > 180 ? 1 : 0;
                              
                              return (
                                <>
                                  {achieved > 0 && (
                                    <path
                                      d={`M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`}
                                      fill="#22c55e"
                                      stroke="white"
                                      strokeWidth="2"
                                    />
                                  )}
                                  
                                  {remaining > 0 && (
                                    <path
                                      d={`M ${cx} ${cy} L ${x2} ${y2} A ${radius} ${radius} 0 ${achievedAngle > 180 ? 0 : 1} 1 ${x1} ${y1} Z`}
                                      fill="#e5e7eb"
                                      stroke="white"
                                      strokeWidth="2"
                                    />
                                  )}
                                  
                                  <text x={cx} y={cy - 8} textAnchor="middle" fontSize="20" fontWeight="700" fill="#22c55e">
                                    {profit.toFixed(1)}%
                                  </text>
                                  <text x={cx} y={cy + 12} textAnchor="middle" fontSize="10" fill="#6b7280">
                                    of {target}% target
                                  </text>
                                </>
                              );
                            })()}
                          </svg>
                          
                          <div className="pie-legend-compact">
                            <div className="pie-legend-item">
                              <span className="pie-legend-color" style={{backgroundColor: '#22c55e'}}></span>
                              <span className="pie-legend-label">Achieved: {(monthlyProfitData[selectedProfitIndex]?.profit || 0).toFixed(1)}%</span>
                            </div>
                            <div className="pie-legend-item">
                              <span className="pie-legend-color" style={{backgroundColor: '#e5e7eb'}}></span>
                              <span className="pie-legend-label">Remaining: {Math.max(0, (monthlyProfitData[selectedProfitIndex]?.target || 100) - (monthlyProfitData[selectedProfitIndex]?.profit || 0)).toFixed(1)}%</span>
                            </div>
                          </div>
                        </div>

                        <button 
                          className="nav-arrow-compact next"
                            onClick={(e) => {
                              e.stopPropagation();
                            if (!monthlyProfitData.length) return;
                            setSelectedProfitIndex(selectedProfitIndex === monthlyProfitData.length - 1 ? monthlyProfitData.length - 1 : selectedProfitIndex + 1);
                          }}
                          disabled={!monthlyProfitData.length || selectedProfitIndex >= monthlyProfitData.length - 1}
                        >
                          ›
                        </button>
                      </div>
                    )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="environment-safety-grid" style={{gridTemplateColumns: 'repeat(4, 1fr)'}}>
              <div className="environment-safety-grid-item">
                <div
                  className="chart-card clickable"
                  onClick={() => openExpandedChart(
                    'zeroAccidents',
                    zeroAccidentsChart || {
                      title: 'Safety',
                      subtitle: 'Zero Accidents',
                      labels: FISCAL_MONTH_SEQUENCE.map(
                        entry => `${MONTH_LABELS[entry.month - 1]} ${entry.year}`
                      ),
                      actuals: Array(12).fill(0),
                      targets: Array(12).fill(0)
                    }
                  )}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && openExpandedChart(
                    'zeroAccidents',
                    zeroAccidentsChart || {
                      title: 'Safety',
                      subtitle: 'Zero Accidents',
                      labels: FISCAL_MONTH_SEQUENCE.map(
                        entry => `${MONTH_LABELS[entry.month - 1]} ${entry.year}`
                      ),
                      actuals: Array(12).fill(0),
                      targets: Array(12).fill(0)
                    }
                  )}
                >
                  {zeroAccidentsLoading ? (
                    <div className="loading">Loading...</div>
                  ) : zeroAccidentsChart ? (
                    <Industry40LineChart
                      title={zeroAccidentsChart.title}
                      subtitle={zeroAccidentsChart.subtitle}
                      labels={zeroAccidentsChart.labels}
                      actuals={zeroAccidentsChart.actuals}
                      targets={zeroAccidentsChart.targets}
                      yAxisFormatter={(val) => Math.round(val)}
                      showAxisLabels={true}
                      showPointLabels={true}
                      xAxisTitle="Month"
                      yAxisTitle="Count"
                    />
                  ) : (
                    <Industry40LineChart
                      title="Safety"
                      subtitle="Zero Accidents"
                      labels={FISCAL_MONTH_SEQUENCE.map(
                        entry => `${MONTH_LABELS[entry.month - 1]} ${entry.year}`
                      )}
                      actuals={Array(12).fill(0)}
                      targets={Array(12).fill(0)}
                      yAxisFormatter={(val) => Math.round(val)}
                      showAxisLabels={true}
                      showPointLabels={true}
                      xAxisTitle="Month"
                      yAxisTitle="Count"
                    />
                  )}
                </div>
              </div>

              <div className="environment-safety-grid-item">
                <div
                  className="chart-card clickable"
                  onClick={() => openExpandedChart(
                    'greenFactory',
                    greenFactoryChart || {
                      title: 'Environment',
                      subtitle: 'Green Factory',
                      labels: FISCAL_MONTH_SEQUENCE.map(
                        entry => `${MONTH_LABELS[entry.month - 1]} ${entry.year}`
                      ),
                      values: Array(12).fill(0)
                    }
                  )}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && openExpandedChart(
                    'greenFactory',
                    greenFactoryChart || {
                      title: 'Environment',
                      subtitle: 'Green Factory',
                      labels: FISCAL_MONTH_SEQUENCE.map(
                        entry => `${MONTH_LABELS[entry.month - 1]} ${entry.year}`
                      ),
                      values: Array(12).fill(0)
                    }
                  )}
                >
                  {greenFactoryLoading ? (
                    <div className="loading">Loading...</div>
                  ) : greenFactoryChart ? (
                    <GreenFactoryBarChart
                      title={greenFactoryChart.title}
                      subtitle={greenFactoryChart.subtitle}
                      labels={greenFactoryChart.labels}
                      values={greenFactoryChart.values}
                      showAxisLabels={true}
                      xAxisTitle="Month"
                      yAxisTitle="Percent"
                    />
                  ) : (
                    <GreenFactoryBarChart
                      title="Environment"
                      subtitle="Green Factory"
                      labels={FISCAL_MONTH_SEQUENCE.map(
                        entry => `${MONTH_LABELS[entry.month - 1]} ${entry.year}`
                      )}
                      values={Array(12).fill(0)}
                      showAxisLabels={true}
                      xAxisTitle="Month"
                      yAxisTitle="Percent"
                    />
                  )}
                </div>
              </div>

              <div className="environment-safety-grid-item">
                <div
                  className="chart-card clickable"
                  onClick={() => openExpandedChart(
                    'onTimeDelivery',
                    onTimeDeliveryChart || {
                      title: 'On Time Delivery',
                      subtitle: 'Target vs Achieved',
                      labels: FISCAL_MONTH_SEQUENCE.map(
                        entry => `${MONTH_LABELS[entry.month - 1]} ${entry.year}`
                      ),
                      actuals: Array(12).fill(0),
                      targets: Array(12).fill(0)
                    }
                  )}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && openExpandedChart(
                    'onTimeDelivery',
                    onTimeDeliveryChart || {
                      title: 'On Time Delivery',
                      subtitle: 'Target vs Achieved',
                      labels: FISCAL_MONTH_SEQUENCE.map(
                        entry => `${MONTH_LABELS[entry.month - 1]} ${entry.year}`
                      ),
                      actuals: Array(12).fill(0),
                      targets: Array(12).fill(0)
                    }
                  )}
                >
                  {onTimeDeliveryLoading ? (
                    <div className="loading">Loading...</div>
                  ) : onTimeDeliveryChart ? (
                    <OnTimeDeliveryBarChart
                      title={onTimeDeliveryChart.title}
                      subtitle={onTimeDeliveryChart.subtitle}
                      labels={onTimeDeliveryChart.labels}
                      actuals={onTimeDeliveryChart.actuals}
                      targets={onTimeDeliveryChart.targets}
                      showAxisLabels={true}
                      xAxisTitle="Month"
                      yAxisTitle="Percent"
                    />
                  ) : (
                    <OnTimeDeliveryBarChart
                      title="On Time Delivery"
                      subtitle="Target vs Achieved"
                      labels={FISCAL_MONTH_SEQUENCE.map(
                        entry => `${MONTH_LABELS[entry.month - 1]} ${entry.year}`
                      )}
                      actuals={Array(12).fill(0)}
                      targets={Array(12).fill(0)}
                      showAxisLabels={true}
                      xAxisTitle="Month"
                      yAxisTitle="Percent"
                    />
                  )}
                </div>
              </div>

              <div className="environment-safety-grid-item">
                <div className="chart-card-split morale-split-card">
                  <div className="split-card-heading">
                    <h4 className="split-card-title">MORALE</h4>
                  </div>
                  <div className="split-card-body">
                    <div
                      className="split-section clickable"
                      onClick={() => openExpandedChart(
                        'themeChart',
                        themeChart || {
                          title: 'Theme Of The Year 2025-26',
                          subtitle: 'Unlock The Power of You',
                          labels: FISCAL_MONTH_SEQUENCE.map(
                            entry => `${MONTH_LABELS[entry.month - 1]} ${entry.year}`
                          ),
                          values: Array(12).fill(0)
                        }
                      )}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === 'Enter' && openExpandedChart(
                        'themeChart',
                        themeChart || {
                          title: 'Theme Of The Year 2025-26',
                          subtitle: 'Unlock The Power of You',
                          labels: FISCAL_MONTH_SEQUENCE.map(
                            entry => `${MONTH_LABELS[entry.month - 1]} ${entry.year}`
                          ),
                          values: Array(12).fill(0)
                        }
                      )}
                    >
                      <div className="split-section-heading">
                        <h5 className="split-section-subtitle">THEME OF THE YEAR 2025-26</h5>
                      </div>
                      {themeChartLoading ? (
                        <div className="loading">Loading...</div>
                      ) : themeChart ? (
                        <Box4ThemeBarChart
                          title={themeChart.title}
                          subtitle={themeChart.subtitle}
                          labels={themeChart.labels}
                          values={themeChart.values}
                          showAxisLabels={true}
                          xAxisTitle="Month"
                          yAxisTitle="Value"
                          showHeader={false}
                        />
                      ) : (
                        <Box4ThemeBarChart
                          title="Theme Of The Year 2025-26"
                          subtitle="Unlock The Power of You"
                          labels={FISCAL_MONTH_SEQUENCE.map(
                            entry => `${MONTH_LABELS[entry.month - 1]} ${entry.year}`
                          )}
                          values={Array(12).fill(0)}
                          showAxisLabels={true}
                          xAxisTitle="Month"
                          yAxisTitle="Value"
                          showHeader={false}
                        />
                      )}
                    </div>

                    <div className="split-divider"></div>

                    <div
                      className="split-section clickable"
                      onClick={() => openExpandedChart(
                        'employeesChart',
                        employeesChart || {
                          title: 'No. of Employees Who Left',
                          subtitle: 'Monthly Attrition',
                          labels: FISCAL_MONTH_SEQUENCE.map(
                            entry => `${MONTH_LABELS[entry.month - 1]} ${entry.year}`
                          ),
                          values: Array(12).fill(0)
                        }
                      )}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === 'Enter' && openExpandedChart(
                        'employeesChart',
                        employeesChart || {
                          title: 'No. of Employees Who Left',
                          subtitle: 'Monthly Attrition',
                          labels: FISCAL_MONTH_SEQUENCE.map(
                            entry => `${MONTH_LABELS[entry.month - 1]} ${entry.year}`
                          ),
                          values: Array(12).fill(0)
                        }
                      )}
                    >
                      <div className="split-section-heading">
                        <h5 className="split-section-subtitle">NO. OF EMPLOYEES WHO LEFT</h5>
                      </div>
                      {employeesChartLoading ? (
                        <div className="loading">Loading...</div>
                      ) : employeesChart ? (
                        <Box4EmployeesLineChart
                          title={employeesChart.title}
                          subtitle={employeesChart.subtitle}
                          labels={employeesChart.labels}
                          values={employeesChart.values}
                          showAxisLabels={true}
                          xAxisTitle="Month"
                          yAxisTitle="Count"
                          showHeader={false}
                        />
                      ) : (
                        <Box4EmployeesLineChart
                          title="No. of Employees Who Left"
                          subtitle="Monthly Attrition"
                          labels={FISCAL_MONTH_SEQUENCE.map(
                            entry => `${MONTH_LABELS[entry.month - 1]} ${entry.year}`
                          )}
                          values={Array(12).fill(0)}
                          showAxisLabels={true}
                          xAxisTitle="Month"
                          yAxisTitle="Count"
                          showHeader={false}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </main>
      </div>

        {expandedChart && expandedChartData && (
          <div className="expanded-chart-modal-overlay" onClick={closeExpandedChart}>
            <div className="expanded-chart-modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="expanded-chart-header">
                <h2 className="expanded-chart-title">
                  {expandedChart === 'zeroAccidents'
                    ? 'Safety - Zero Accidents'
                    : expandedChart === 'industry40'
                    ? 'Industry 4.0 Performance'
                    : expandedChart === 'zeroQuality'
                    ? 'Zero Quality Complaints'
                    : expandedChart === 'plantEfficiency'
                    ? 'Plant Efficiency (Apr 2025 - Mar 2026)'
                    : expandedChart === 'salesProfit'
                    ? 'Revenue & Profitability'
                    : expandedChart === 'greenFactory'
                    ? 'Environment - Green Factory'
                    : expandedChart === 'onTimeDelivery'
                    ? 'On Time Delivery'
                    : expandedChart === 'themeChart'
                    ? 'Theme Of The Year 2025-26'
                    : expandedChart === 'employeesChart'
                    ? 'No. of Employees Who Left'
                    : 'Chart'}
                </h2>
                <button
                  className="expanded-chart-close-btn"
                  onClick={closeExpandedChart}
                  aria-label="Close expanded view"
                >
                  ×
                </button>
              </div>
              <div className="expanded-chart-body">
                {expandedChart === 'plantEfficiency' && expandedChartData && (
                  <div className="speedometer-compact">
                    <button
                      className="nav-arrow-compact prev"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!monthlyEfficiency.length) return;
                        setSelectedFiscalIndex(selectedFiscalIndex === 0 ? monthlyEfficiency.length - 1 : selectedFiscalIndex - 1);
                      }}
                      disabled={!monthlyEfficiency.length}
                    >
                      ‹
                    </button>

                    <SpeedometerGauge
                      efficiency={monthlyEfficiency[selectedFiscalIndex]?.efficiency || 0}
                      month={MONTH_LABELS[(monthlyEfficiency[selectedFiscalIndex]?.month || 1) - 1]}
                      year={monthlyEfficiency[selectedFiscalIndex]?.year || ''}
                    />

                    <button
                      className="nav-arrow-compact next"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!monthlyEfficiency.length) return;
                        setSelectedFiscalIndex(selectedFiscalIndex === monthlyEfficiency.length - 1 ? monthlyEfficiency.length - 1 : selectedFiscalIndex + 1);
                      }}
                      disabled={!monthlyEfficiency.length || selectedFiscalIndex >= monthlyEfficiency.length - 1}
                    >
                      ›
                    </button>
                  </div>
                )}

                {expandedChart === 'industry40' && expandedChartData && (
                  <Industry40LineChart
                    title={expandedChartData.title}
                    labels={expandedChartData.labels}
                    actuals={expandedChartData.actuals}
                    targets={expandedChartData.targets}
                    showAxisLabels={true}
                    showPointLabels={true}
                  />
                )}

                {expandedChart === 'zeroQuality' && expandedChartData && (
                  <Industry40LineChart
                    title={expandedChartData.title}
                    labels={expandedChartData.labels}
                    actuals={expandedChartData.actuals}
                    targets={expandedChartData.targets}
                    showAxisLabels={true}
                    showPointLabels={true}
                  />
                )}

                {expandedChart === 'salesProfit' && expandedChartData && (
                  <div className="chart-card-split cost-split-card">
                    <div className="split-card-heading">
                      <h4 className="split-card-title">COST</h4>
                    </div>
                    <div className="split-card-body">
                      <div className="split-section">
                        <div className="split-section-heading">
                          <h5 className="split-section-subtitle">REVENUE</h5>
                        </div>
                      {salesLoading ? (
                        <div className="loading">Loading...</div>
                      ) : (
                        <div className="pie-chart-with-nav">
                          <button
                            className="nav-arrow-compact prev"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!monthlySalesData.length) return;
                              setSelectedSalesIndex(selectedSalesIndex === 0 ? monthlySalesData.length - 1 : selectedSalesIndex - 1);
                            }}
                            disabled={!monthlySalesData.length}
                          >
                            ‹
                          </button>

                          <div className="pie-chart-display">
                            <h5 className="pie-month-title">
                              {MONTH_LABELS[(monthlySalesData[selectedSalesIndex]?.month || 1) - 1]} {monthlySalesData[selectedSalesIndex]?.year || ''}
                            </h5>
                            <svg viewBox="0 0 200 200" className="profit-pie-svg">
                              {(() => {
                                const salesData = monthlySalesData[selectedSalesIndex] || { actual: 0, target: 0 };
                                const radius = 70;
                                const cx = 100;
                                const cy = 100;
                                const sales = Math.max(0, salesData.actual || 0);
                                const targetSales = Math.max(0, salesData.target || 0);
                                const total = sales + targetSales || 100;
                                
                                // Fixed colors: Blue for sales, Orange for target
                                const salesColor = '#3b82f6';
                                const targetColor = '#f59e0b';
                                
                                // Calculate angles for sales and target
                                const salesAngle = (sales / total) * 360;
                                const targetAngle = (targetSales / total) * 360;
                                
                                const salesRadians = (salesAngle * Math.PI) / 180;
                                const targetRadians = (targetAngle * Math.PI) / 180;
                                
                                // Starting point
                                const x1 = cx + radius * Math.cos(-Math.PI / 2);
                                const y1 = cy + radius * Math.sin(-Math.PI / 2);
                                
                                // Sales segment end
                                const x2 = cx + radius * Math.cos(-Math.PI / 2 + salesRadians);
                                const y2 = cy + radius * Math.sin(-Math.PI / 2 + salesRadians);
                                
                                // Target segment end
                                const x3 = cx + radius * Math.cos(-Math.PI / 2 + salesRadians + targetRadians);
                                const y3 = cy + radius * Math.sin(-Math.PI / 2 + salesRadians + targetRadians);
                                
                                const salesLargeArc = salesAngle > 180 ? 1 : 0;
                                const targetLargeArc = targetAngle > 180 ? 1 : 0;
                                
                                // Calculate midpoint for sales label
                                const salesMidAngle = -Math.PI / 2 + (salesRadians / 2);
                                const salesLabelX = cx + (radius * 0.65) * Math.cos(salesMidAngle);
                                const salesLabelY = cy + (radius * 0.65) * Math.sin(salesMidAngle);
                                
                                // Calculate midpoint for target label
                                const targetMidAngle = -Math.PI / 2 + salesRadians + (targetRadians / 2);
                                const targetLabelX = cx + (radius * 0.65) * Math.cos(targetMidAngle);
                                const targetLabelY = cy + (radius * 0.65) * Math.sin(targetMidAngle);
                                
                                return (
                                  <>
                                    {sales > 0 && (
                                      <path
                                        d={`M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${salesLargeArc} 1 ${x2} ${y2} Z`}
                                        fill={salesColor}
                                        stroke="white"
                                        strokeWidth="2"
                                      />
                                    )}
                                    
                                    {targetSales > 0 && (
                                      <path
                                        d={`M ${cx} ${cy} L ${x2} ${y2} A ${radius} ${radius} 0 ${targetLargeArc} 1 ${x3} ${y3} Z`}
                                        fill={targetColor}
                                        stroke="white"
                                        strokeWidth="2"
                                      />
                                    )}
                                    
                                    {sales > 0 && (
                                      <text x={salesLabelX} y={salesLabelY} textAnchor="middle" fontSize="12" fontWeight="700" fill="white">
                                        {sales.toFixed(0)}
                                      </text>
                                    )}
                                    
                                    {targetSales > 0 && (
                                      <text x={targetLabelX} y={targetLabelY} textAnchor="middle" fontSize="12" fontWeight="700" fill="white">
                                        {targetSales.toFixed(0)}
                                      </text>
                                    )}
                                  </>
                                );
                              })()}
                            </svg>

                            <div className="pie-legend-compact">
                              <div className="pie-legend-item">
                                <span className="pie-legend-color" style={{ backgroundColor: '#3b82f6' }}></span>
                                <span className="pie-legend-label">Sales: {(monthlySalesData[selectedSalesIndex]?.actual || 0).toFixed(0)}</span>
                              </div>
                              <div className="pie-legend-item">
                                <span className="pie-legend-color" style={{ backgroundColor: '#f59e0b' }}></span>
                                <span className="pie-legend-label">Target Sales: {(monthlySalesData[selectedSalesIndex]?.target || 0).toFixed(0)}</span>
                              </div>
                            </div>
                          </div>

                          <button
                            className="nav-arrow-compact next"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!monthlySalesData.length) return;
                              setSelectedSalesIndex(selectedSalesIndex === monthlySalesData.length - 1 ? monthlySalesData.length - 1 : selectedSalesIndex + 1);
                            }}
                            disabled={!monthlySalesData.length || selectedSalesIndex >= monthlySalesData.length - 1}
                          >
                            ›
                          </button>
                        </div>
                      )}
                      </div>

                      <div className="split-divider"></div>

                      <div className="split-section">
                        <div className="split-section-heading">
                          <h5 className="split-section-subtitle">PROFITABILITY (YTD)</h5>
                        </div>
                      {profitabilityLoading ? (
                        <div className="loading">Loading...</div>
                      ) : (
                        <div className="pie-chart-with-nav">
                          <button
                            className="nav-arrow-compact prev"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!monthlyProfitData.length) return;
                              setSelectedProfitIndex(selectedProfitIndex === 0 ? monthlyProfitData.length - 1 : selectedProfitIndex - 1);
                            }}
                            disabled={!monthlyProfitData.length}
                          >
                            ‹
                          </button>

                          <div className="pie-chart-display">
                            <h5 className="pie-month-title">
                              {MONTH_LABELS[(monthlyProfitData[selectedProfitIndex]?.month || 1) - 1]} {monthlyProfitData[selectedProfitIndex]?.year || ''}
                            </h5>
                            <svg viewBox="0 0 200 200" className="profit-pie-svg">
                              {(() => {
                                const profitData = monthlyProfitData[selectedProfitIndex] || { profit: 0, target: 100 };
                                const radius = 70;
                                const cx = 100;
                                const cy = 100;
                                const profit = profitData.profit;
                                const target = profitData.target;
                                const achieved = Math.min(profit, target);
                                const remaining = Math.max(0, target - profit);
                                const total = achieved + remaining;

                                const achievedAngle = (achieved / total) * 360;
                                const achievedRadians = (achievedAngle * Math.PI) / 180;

                                const x1 = cx + radius * Math.cos(-Math.PI / 2);
                                const y1 = cy + radius * Math.sin(-Math.PI / 2);
                                const x2 = cx + radius * Math.cos(-Math.PI / 2 + achievedRadians);
                                const y2 = cy + radius * Math.sin(-Math.PI / 2 + achievedRadians);

                                const largeArc = achievedAngle > 180 ? 1 : 0;

                                return (
                                  <>
                                    {achieved > 0 && (
                                      <path
                                        d={`M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`}
                                        fill="#22c55e"
                                        stroke="white"
                                        strokeWidth="2"
                                      />
                                    )}

                                    {remaining > 0 && (
                                      <path
                                        d={`M ${cx} ${cy} L ${x2} ${y2} A ${radius} ${radius} 0 ${achievedAngle > 180 ? 0 : 1} 1 ${x1} ${y1} Z`}
                                        fill="#e5e7eb"
                                        stroke="white"
                                        strokeWidth="2"
                                      />
                                    )}

                                    <text x={cx} y={cy - 8} textAnchor="middle" fontSize="20" fontWeight="700" fill="#22c55e">
                                      {profit.toFixed(1)}%
                                    </text>
                                    <text x={cx} y={cy + 12} textAnchor="middle" fontSize="10" fill="#6b7280">
                                      of {target}% target
                                    </text>
                                  </>
                                );
                              })()}
                            </svg>

                            <div className="pie-legend-compact">
                              <div className="pie-legend-item">
                                <span className="pie-legend-color" style={{ backgroundColor: '#22c55e' }}></span>
                                <span className="pie-legend-label">Achieved: {(monthlyProfitData[selectedProfitIndex]?.profit || 0).toFixed(1)}%</span>
                              </div>
                              <div className="pie-legend-item">
                                <span className="pie-legend-color" style={{ backgroundColor: '#e5e7eb' }}></span>
                                <span className="pie-legend-label">Remaining: {Math.max(0, (monthlyProfitData[selectedProfitIndex]?.target || 100) - (monthlyProfitData[selectedProfitIndex]?.profit || 0)).toFixed(1)}%</span>
                              </div>
                            </div>
                          </div>

                          <button
                            className="nav-arrow-compact next"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!monthlyProfitData.length) return;
                              setSelectedProfitIndex(selectedProfitIndex === monthlyProfitData.length - 1 ? monthlyProfitData.length - 1 : selectedProfitIndex + 1);
                            }}
                            disabled={!monthlyProfitData.length || selectedProfitIndex >= monthlyProfitData.length - 1}
                          >
                            ›
                          </button>
                        </div>
                      )}
                      </div>
                    </div>
                  </div>
                )}

                {expandedChart === 'zeroAccidents' && expandedChartData && (
                  <Industry40LineChart
                    title={expandedChartData.title}
                    subtitle={expandedChartData.subtitle}
                    labels={expandedChartData.labels}
                    actuals={expandedChartData.actuals}
                    targets={expandedChartData.targets}
                    yAxisFormatter={(val) => Math.round(val)}
                    showAxisLabels={true}
                    showPointLabels={true}
                    xAxisTitle="Month"
                    yAxisTitle="Value"
                  />
                )}
                {expandedChart === 'greenFactory' && expandedChartData && (
                  <GreenFactoryBarChart
                    title={expandedChartData.title}
                    subtitle={expandedChartData.subtitle}
                    labels={expandedChartData.labels}
                    values={expandedChartData.values}
                    showAxisLabels={true}
                    xAxisTitle="Month"
                    yAxisTitle="Percent"
                  />
                )}

                {expandedChart === 'onTimeDelivery' && expandedChartData && (
                  <OnTimeDeliveryBarChart
                    title={expandedChartData.title}
                    subtitle={expandedChartData.subtitle}
                    labels={expandedChartData.labels}
                    actuals={expandedChartData.actuals}
                    targets={expandedChartData.targets}
                    showAxisLabels={true}
                    xAxisTitle="Month"
                    yAxisTitle="Percent"
                  />
                )}

                {expandedChart === 'themeChart' && expandedChartData && (
                  <Box4ThemeBarChart
                    title={expandedChartData.title}
                    subtitle={expandedChartData.subtitle}
                    labels={expandedChartData.labels}
                    values={expandedChartData.values}
                    showAxisLabels={true}
                    xAxisTitle="Month"
                    yAxisTitle="Value"
                  />
                )}

                {expandedChart === 'employeesChart' && expandedChartData && (
                  <Box4EmployeesLineChart
                    title={expandedChartData.title}
                    subtitle={expandedChartData.subtitle}
                    labels={expandedChartData.labels}
                    values={expandedChartData.values}
                    showAxisLabels={true}
                    xAxisTitle="Month"
                    yAxisTitle="Count"
                  />
                )}
              </div>
            </div>
          </div>
        )}
    </div>
  );
}

export default UserDashboard;
