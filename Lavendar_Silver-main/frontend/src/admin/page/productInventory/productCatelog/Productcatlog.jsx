import React, { useState } from 'react';
import './Productcatlog.css';
import Category from './category/Category';
import SubCategory from './subcategory/SubCategory';
import SubSubcategory from './subSubcategory/SubSubcategory';
import GemstoneCatalog from './GemstoneCatalog';
import CatalogHierarchy from './HierarchyView/CatalogHierarchy';

const Productcatlog = () => {
    const [activeTab, setActiveTab] = useState('hierarchy');

    return (
        <div className="admin-productcatlog-wrapper">
            <h1>Product Catalog</h1>
            <div className="admin-productcatlog-toggle-btns">
                <button
                    className={activeTab === 'hierarchy' ? 'admin-productcatlog-toggle-btn active' : 'admin-productcatlog-toggle-btn'}
                    onClick={() => setActiveTab('hierarchy')}
                >
                    Category View
                </button>
                <button
                    className={activeTab === 'category' ? 'admin-productcatlog-toggle-btn active' : 'admin-productcatlog-toggle-btn'}
                    onClick={() => setActiveTab('category')}
                >
                    Category
                </button>
                <button
                    className={activeTab === 'subcategory' ? 'admin-productcatlog-toggle-btn active' : 'admin-productcatlog-toggle-btn'}
                    onClick={() => setActiveTab('subcategory')}
                >
                    Subcategory
                </button>
                <button
                    className={activeTab === 'sub-subcategory' ? 'admin-productcatlog-toggle-btn active' : 'admin-productcatlog-toggle-btn'}
                    onClick={() => setActiveTab('sub-subcategory')}
                >
                    Sub-Subcategory
                </button>
                <button
                    className={activeTab === 'gemstone' ? 'admin-productcatlog-toggle-btn active' : 'admin-productcatlog-toggle-btn'}
                    onClick={() => setActiveTab('gemstone')}
                >
                    Gemstone Catalog
                </button>
            </div>
            {activeTab === 'hierarchy' && <CatalogHierarchy />}
            {activeTab === 'category' && <Category />}
            {activeTab === 'subcategory' && <SubCategory />}
            {activeTab === 'sub-subcategory' && <SubSubcategory />}
            {activeTab === 'gemstone' && <GemstoneCatalog />}
        </div>
    );
};

export default Productcatlog;