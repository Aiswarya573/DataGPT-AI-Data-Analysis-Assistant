import React, { useEffect, useRef } from 'react';
import Plotly from 'plotly.js-dist-min';

export interface PlotlyChartProps {
  data: any[];
  layout?: Partial<Plotly.Layout>;
  config?: Partial<Plotly.Config>;
  style?: React.CSSProperties;
  className?: string;
}

export const PlotlyChart: React.FC<PlotlyChartProps> = ({
  data,
  layout = {},
  config = {},
  style,
  className = 'w-full h-80',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const defaultLayout: Partial<Plotly.Layout> = {
      autosize: true,
      font: { family: 'Inter, system-ui, sans-serif', color: '#334155' },
      paper_bgcolor: 'transparent',
      plot_bgcolor: 'transparent',
      margin: { l: 50, r: 30, t: 50, b: 50 },
      colorway: ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899'],
      xaxis: {
        gridcolor: '#f1f5f9',
        zerolinecolor: '#cbd5e1',
        tickfont: { size: 11 },
      },
      yaxis: {
        gridcolor: '#f1f5f9',
        zerolinecolor: '#cbd5e1',
        tickfont: { size: 11 },
      },
      hoverlabel: {
        bgcolor: '#1e293b',
        font: { color: '#ffffff', size: 12 },
      },
      ...layout,
    };

    const defaultConfig: Partial<Plotly.Config> = {
      responsive: true,
      displayModeBar: true,
      displaylogo: false,
      modeBarButtonsToRemove: ['lasso2d', 'select2d'],
      toImageButtonOptions: {
        format: 'png',
        filename: 'datagpt_chart',
        height: 600,
        width: 1000,
        scale: 2,
      },
      ...config,
    };

    Plotly.newPlot(containerRef.current, data, defaultLayout, defaultConfig);

    const handleResize = () => {
      if (containerRef.current) {
        Plotly.Plots.resize(containerRef.current);
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (containerRef.current) {
        Plotly.purge(containerRef.current);
      }
    };
  }, [data, layout, config]);

  return <div ref={containerRef} className={className} style={style} />;
};
