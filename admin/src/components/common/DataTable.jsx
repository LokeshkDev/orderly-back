import React, { useState, useMemo } from 'react';
import { FiEdit2, FiTrash2, FiSearch, FiChevronLeft, FiChevronRight, FiCheck, FiX } from 'react-icons/fi';
import './DataTable.css';

const DataTable = ({ 
  columns, 
  data = [], 
  onEdit, 
  onDelete, 
  onToggle,
  searchPlaceholder = 'Search...',
  keyField = '_id'
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    return data.filter(item => {
      return Object.values(item).some(val => 
        String(val).toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [data, searchTerm]);

  const sortedData = useMemo(() => {
    let sortableItems = [...filteredData];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [filteredData, sortConfig]);

  const totalPages = Math.ceil(sortedData.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = sortedData.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const renderCell = (item, col) => {
    if (col.render) {
      return col.render(item[col.key], item);
    }
    return item[col.key];
  };

  return (
    <div className="datatable-container">
      <div className="datatable-header">
        <div className="search-box">
          <FiSearch className="search-icon" />
          <input 
            type="text" 
            placeholder={searchPlaceholder} 
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
        <div className="per-page-selector">
          <span className="text-muted" style={{ fontSize: '0.85rem' }}>Show:</span>
          <select 
            value={itemsPerPage} 
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>

      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              {columns.map((col, idx) => (
                <th 
                  key={idx} 
                  style={{ cursor: col.sortable !== false ? 'pointer' : 'default', width: col.width }}
                  onClick={() => col.sortable !== false && handleSort(col.key)}
                >
                  <div className="flex items-center gap-2">
                    {col.label}
                    {sortConfig.key === col.key && (
                      <span style={{ fontSize: '0.7rem' }}>
                        {sortConfig.direction === 'asc' ? '▲' : '▼'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
              {(onEdit || onDelete || onToggle) && <th style={{ width: '120px', textAlign: 'right' }}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {paginatedData.length > 0 ? (
              paginatedData.map((item, idx) => (
                <tr key={item[keyField] || idx}>
                  {columns.map((col, cIdx) => (
                    <td key={cIdx}>
                      {renderCell(item, col)}
                    </td>
                  ))}
                  {(onEdit || onDelete || onToggle) && (
                    <td style={{ textAlign: 'right' }}>
                      <div className="action-buttons">
                        {onToggle && (
                          <button 
                            className={`action-btn ${item.isActive !== false ? 'success' : 'danger'}`}
                            onClick={() => onToggle(item)}
                            title={item.isActive !== false ? "Deactivate" : "Activate"}
                          >
                            {item.isActive !== false ? <FiCheck /> : <FiX />}
                          </button>
                        )}
                        {onEdit && (
                          <button className="action-btn primary" onClick={() => onEdit(item)} title="Edit">
                            <FiEdit2 />
                          </button>
                        )}
                        {onDelete && (
                          <button className="action-btn danger" onClick={() => onDelete(item)} title="Delete">
                            <FiTrash2 />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length + (onEdit || onDelete || onToggle ? 1 : 0)} style={{ textAlign: 'center', padding: '32px' }}>
                  <span className="text-muted">No data found</span>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="datatable-footer">
        <div className="text-muted" style={{ fontSize: '0.85rem' }}>
          Showing {sortedData.length > 0 ? startIndex + 1 : 0} to {Math.min(startIndex + itemsPerPage, sortedData.length)} of {sortedData.length} entries
        </div>
        <div className="pagination">
          <button 
            className="pagination-btn" 
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <FiChevronLeft />
          </button>
          
          {[...Array(totalPages)].map((_, i) => {
            // Show limited pages logic could go here for many pages, keeping simple for now
            const page = i + 1;
            if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
              return (
                <button 
                  key={page}
                  className={`pagination-btn ${currentPage === page ? 'active' : ''}`}
                  onClick={() => handlePageChange(page)}
                >
                  {page}
                </button>
              );
            } else if (page === currentPage - 2 || page === currentPage + 2) {
              return <span key={page} className="pagination-dots">...</span>;
            }
            return null;
          })}

          <button 
            className="pagination-btn" 
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages || totalPages === 0}
          >
            <FiChevronRight />
          </button>
        </div>
      </div>
    </div>
  );
};

export default DataTable;
