import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ChevronRight, ChevronDown, LayoutGrid, Grid, Layers, Search } from 'lucide-react';
import './CatalogHierarchy.css';

const CatalogHierarchy = () => {
    const [hierarchy, setHierarchy] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedIds, setExpandedIds] = useState(new Set());

    const API_BASE_URL = import.meta.env.VITE_API_URL;

    useEffect(() => {
        fetchHierarchy();
    }, []);

    const fetchHierarchy = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_BASE_URL}/api/categories/hierarchy`);
            if (response.data.success) {
                setHierarchy(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching hierarchy:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleExpand = (id) => {
        const newExpanded = new Set(expandedIds);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedIds(newExpanded);
    };

    const expandAll = () => {
        const allIds = new Set();
        hierarchy.forEach(cat => {
            allIds.add(`cat-${cat.id}`);
            cat.subcategories?.forEach(sub => {
                allIds.add(`sub-${sub.id}`);
            });
        });
        setExpandedIds(allIds);
    };

    const collapseAll = () => {
        setExpandedIds(new Set());
    };

    const filterHierarchy = (data) => {
        if (!searchTerm) return data;

        return data.filter(cat => {
            const catMatches = cat.name.toLowerCase().includes(searchTerm.toLowerCase());
            
            const filteredSubs = cat.subcategories?.filter(sub => {
                const subMatches = sub.name.toLowerCase().includes(searchTerm.toLowerCase());
                
                const filteredSubSubs = sub.subSubcategories?.filter(ssc => {
                    return ssc.name.toLowerCase().includes(searchTerm.toLowerCase());
                });

                const hasMatchingSubSubs = filteredSubSubs && filteredSubSubs.length > 0;
                
                return subMatches || hasMatchingSubSubs;
            });

            const hasMatchingSubs = filteredSubs && filteredSubs.length > 0;

            return catMatches || hasMatchingSubs;
        }).map(cat => {
            return {
                ...cat,
                subcategories: cat.subcategories?.filter(sub => {
                    const subMatches = sub.name.toLowerCase().includes(searchTerm.toLowerCase());
                    const filteredSubSubs = sub.subSubcategories?.filter(ssc => 
                        ssc.name.toLowerCase().includes(searchTerm.toLowerCase())
                    );
                    return subMatches || (filteredSubSubs && filteredSubSubs.length > 0);
                }).map(sub => ({
                    ...sub,
                    subSubcategories: sub.subSubcategories?.filter(ssc => 
                        ssc.name.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                }))
            };
        });
    };

    const filteredData = filterHierarchy(hierarchy);

    if (loading) return <div className="catalog-hierarchy-loading">Loading Folder Structure...</div>;

    return (
        <div className="catalog-hierarchy-container">
            <div className="catalog-hierarchy-header">
                <div className="catalog-hierarchy-controls">
                    <div className="hierarchy-search-box">
                        <Search size={18} />
                        <input 
                            type="text" 
                            placeholder="Search categories..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="hierarchy-action-btns">
                        <button onClick={expandAll}>Expand All</button>
                        <button onClick={collapseAll}>Collapse All</button>
                    </div>
                </div>
            </div>

            <div className="catalog-hierarchy-tree">
                {filteredData.length === 0 ? (
                    <div className="no-hierarchy-data">No categories found matching your criteria.</div>
                ) : (
                    filteredData.map(category => (
                        <div key={`cat-${category.id}`} className="hierarchy-item category-level">
                            <div className="hierarchy-row" onClick={() => toggleExpand(`cat-${category.id}`)}>
                                {category.subcategories?.length > 0 ? (
                                    expandedIds.has(`cat-${category.id}`) ? <ChevronDown size={16} /> : <ChevronRight size={16} />
                                ) : <span style={{ width: 16 }}></span>}
                                <LayoutGrid className="icon-category" size={18} />
                                <span className="item-name">{category.name}</span>
                                <span className="item-count">({category.subcategories?.length || 0} Subs)</span>
                                <span className={`status-badge ${category.status?.toLowerCase()}`}>{category.status}</span>
                            </div>
                            
                            {expandedIds.has(`cat-${category.id}`) && (
                                <div className="hierarchy-children">
                                    {category.subcategories?.map(subcategory => (
                                        <div key={`sub-${subcategory.id}`} className="hierarchy-item subcategory-level">
                                            <div className="hierarchy-row" onClick={() => toggleExpand(`sub-${subcategory.id}`)}>
                                                {subcategory.subSubcategories?.length > 0 ? (
                                                    expandedIds.has(`sub-${subcategory.id}`) ? <ChevronDown size={16} /> : <ChevronRight size={16} />
                                                ) : <span style={{ width: 16 }}></span>}
                                                <Grid className="icon-subcategory" size={18} />
                                                <span className="item-name">{subcategory.name}</span>
                                                <span className="item-count">({subcategory.subSubcategories?.length || 0} Sub-Subs)</span>
                                                <span className={`status-badge ${subcategory.status?.toLowerCase()}`}>{subcategory.status}</span>
                                            </div>

                                            {expandedIds.has(`sub-${subcategory.id}`) && (
                                                <div className="hierarchy-children">
                                                    {subcategory.subSubcategories?.map(subSub => (
                                                        <div key={`ssc-${subSub.id}`} className="hierarchy-item sub-subcategory-level">
                                                            <div className="hierarchy-row">
                                                                <span style={{ width: 16 }}></span>
                                                                <Layers className="icon-sub-subcategory" size={18} />
                                                                <span className="item-name">{subSub.name}</span>
                                                                <span className={`status-badge ${subSub.status?.toLowerCase()}`}>{subSub.status}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default CatalogHierarchy;

