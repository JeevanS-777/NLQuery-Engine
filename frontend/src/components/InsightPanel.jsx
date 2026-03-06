import React, { useState, useEffect } from 'react';
import { FaChevronRight, FaChevronLeft, FaDatabase, FaCode, FaChartBar } from 'react-icons/fa';
import styles from './InsightPanel.module.css';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const InsightPanel = ({ file, isCollapsed, onToggle, technicalDetails, chartConfig }) => {
  const[activeTab, setActiveTab] = useState(null);

  useEffect(() => {
    if (technicalDetails && typeof technicalDetails === 'object') {
      const keys = Object.keys(technicalDetails);
      if (keys.length > 0 && (!activeTab || !keys.includes(activeTab))) setActiveTab(keys[0]);
    }
  }, [technicalDetails, activeTab]);

  if (isCollapsed) return (
    <aside className={`${styles.panel} ${styles.collapsed}`} onClick={onToggle} data-tooltip="Expand">
        <div className={styles.collapsedBar}><FaChevronLeft /></div>
    </aside>
  );

  const preview = file?.previewData?.preview ||[];
  const headers = preview.length > 0 ? Object.keys(preview[0]) :[];

  const getChartData = () => {
      if (!technicalDetails || !technicalDetails["Query Results"]) return[];
      try { const data = JSON.parse(technicalDetails["Query Results"]); return Array.isArray(data) ? data :[]; } catch (e) { return[]; }
  };

  const getSafeSqlContent = (dialect) => {
    if (!technicalDetails || !dialect) return "";
    const content = technicalDetails[dialect];
    return typeof content === 'object' && content !== null ? Object.values(content)[0] || "" : String(content || "");
  };

  const chartData = getChartData();
  const currentTab = activeTab || (technicalDetails ? Object.keys(technicalDetails)[0] : null);

  return (
    <aside className={styles.panel}>
      <div className={styles.headerContainer}>
        <h2 className={styles.header}>Insight Panel</h2>
        <button onClick={onToggle} className={styles.toggleBtn} data-tooltip-bottom="Collapse"><FaChevronRight /></button>
      </div>

      <div className={styles.content}>
        {file ? (
          <>
            {chartConfig && chartData.length > 0 && (
                <div className={styles.section}>
                    <div className={styles.sectionHeader}><FaChartBar className={styles.sectionIcon} /> <h3 className={styles.subHeader}>Visual Analysis</h3></div>
                    <div className={styles.chartContainer}>
                        <ResponsiveContainer width="100%" height={250}>
                            {chartConfig.type === 'area' ? (
                                <AreaChart data={chartData}><CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} /><XAxis dataKey={chartConfig.xAxisKey} stroke="var(--text-secondary)" fontSize={10} tickLine={false} axisLine={false} /><YAxis stroke="var(--text-secondary)" fontSize={10} tickLine={false} axisLine={false} /><Tooltip contentStyle={{ backgroundColor: '#1e1e1e', border: '1px solid var(--border-color)' }} itemStyle={{ color: '#fff' }} /><Area type="monotone" dataKey={chartConfig.dataKey} stroke="var(--accent-primary)" fill="var(--accent-primary)" fillOpacity={0.3} /></AreaChart>
                            ) : (
                                <BarChart data={chartData}><CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} /><XAxis dataKey={chartConfig.xAxisKey} stroke="var(--text-secondary)" fontSize={10} tickLine={false} axisLine={false} /><YAxis stroke="var(--text-secondary)" fontSize={10} tickLine={false} axisLine={false} /><Tooltip contentStyle={{ backgroundColor: '#1e1e1e', border: '1px solid var(--border-color)' }} itemStyle={{ color: '#fff' }} cursor={{fill: 'rgba(255,255,255,0.05)'}} /><Bar dataKey={chartConfig.dataKey} fill="var(--accent-primary)" radius={[4, 4, 0, 0]} /></BarChart>
                            )}
                        </ResponsiveContainer>
                        <p className={styles.chartTitle}>{chartConfig.title}</p>
                    </div>
                </div>
            )}

            <div className={styles.section}>
              <div className={styles.sectionHeader}><FaDatabase className={styles.sectionIcon} /> <h3 className={styles.subHeader}>Data Preview</h3></div>
              <div className={styles.tableWrap}>
                {preview.length > 0 ? (
                  <table><thead><tr>{headers.map(h => <th key={h}>{h}</th>)}</tr></thead><tbody>{preview.map((row, i) => <tr key={i}>{headers.map(h => <td key={h}>{String(row[h])}</td>)}</tr>)}</tbody></table>
                ) : <p className={styles.emptyText}>No data.</p>}
              </div>
            </div>

            {technicalDetails && Object.keys(technicalDetails).length > 0 && (
              <div className={styles.section}>
                <div className={styles.sectionHeader}><FaCode className={styles.sectionIcon} /> <h3 className={styles.subHeader}>SQL Logic</h3></div>
                <div className={styles.tabContainer}>
                  {Object.keys(technicalDetails).map(d => <button key={d} className={`${styles.tab} ${currentTab === d ? styles.activeTab : ''}`} onClick={() => setActiveTab(d)}>{d}</button>)}
                </div>
                <AnimatePresence mode="wait">
                  <motion.div key={currentTab} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: 0.15 }} className={styles.codeBlock}>
                    <ReactMarkdown children={`\`\`\`sql\n${getSafeSqlContent(currentTab)}\n\`\`\``} />
                  </motion.div>
                </AnimatePresence>
              </div>
            )}
          </>
        ) : <div className={styles.emptyState}>No document selected</div>}
      </div>
    </aside>
  );
};
export default InsightPanel;
