import React, { useState, useEffect } from 'react';
import { 
  FiPlus, FiSearch, FiEdit, FiTrash2, FiX, FiCheck, 
  FiLayers, FiPackage, FiGrid, FiTag, FiShoppingBag, FiDollarSign, FiPercent, FiBox, FiCopy, FiFolder
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../../services/api.js';
import ComboCover from '../../components/common/ComboCover';
import FileUploadInput from '../../components/common/FileUploadInput';
import './CombosList.css';

const CombosList = () => {
  const [combos, setCombos] = useState([]);
  const [productsCatalog, setProductsCatalog] = useState([]);
  const [comboCategories, setComboCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [pieceFilter, setPieceFilter] = useState('All');
  const [modeFilter, setModeFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('existing'); // 'existing' or 'custom'
  const [editingCombo, setEditingCombo] = useState(null);

  // Bulk Selection & Batch Actions State
  const [selectedComboIds, setSelectedComboIds] = useState([]);
  const [isBulkCategoryModalOpen, setIsBulkCategoryModalOpen] = useState(false);
  const [isBulkPriceModalOpen, setIsBulkPriceModalOpen] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkCategory, setBulkCategory] = useState('');
  const [bulkCategorySlug, setBulkCategorySlug] = useState('');
  const [bulkCategories, setBulkCategories] = useState([]);
  const [bulkCategoryMode, setBulkCategoryMode] = useState('replace'); // 'replace' or 'append'
  const [bulkSubcategory, setBulkSubcategory] = useState('');
  const [bulkSubcategorySlug, setBulkSubcategorySlug] = useState('');
  const [priceAdjustmentTarget, setPriceAdjustmentTarget] = useState('offer_price'); // 'offer_price', 'original_price', 'both'
  const [priceAdjustmentType, setPriceAdjustmentType] = useState('fixed'); // 'fixed', 'increase_amount', 'decrease_amount', 'increase_percent', 'decrease_percent'
  const [priceAdjustmentValue, setPriceAdjustmentValue] = useState('');

  // Form State
  const [piecesCount, setPiecesCount] = useState(2);
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    slug: '',
    category: '',
    category_slug: '',
    categories: [],
    category_slugs: [],
    subcategory: '',
    subcategory_slug: '',
    offer_price: 0,
    original_price: 0,
    badge: '',
    status: 'Active',
    description: '',
    images: [],
    is_existing_products_combo: true,
    items: []
  });

  // Selected product IDs for Existing Products mode
  const [selectedProductIds, setSelectedProductIds] = useState(['', '', '', '']);

  // Fetch combos, products & combo categories from DB
  const loadData = async () => {
    setLoading(true);
    try {
      const [combosRes, productsRes, catsRes] = await Promise.all([
        api.get('/combos?all=true'),
        api.get('/products?all=true'),
        api.get('/categories?type=combo')
      ]);

      if (combosRes.data && combosRes.data.success && Array.isArray(combosRes.data.data)) {
        setCombos(combosRes.data.data.filter(c => !c.deleted));
      } else {
        setCombos([]);
      }

      if (productsRes.data && productsRes.data.success && Array.isArray(productsRes.data.data)) {
        setProductsCatalog(productsRes.data.data);
      } else {
        setProductsCatalog([]);
      }

      if (catsRes.data && catsRes.data.success && Array.isArray(catsRes.data.data)) {
        setComboCategories(catsRes.data.data);
      } else {
        setComboCategories([]);
      }
    } catch (err) {
      console.warn('Failed to load combos/products/categories from DB:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Helper to extract a product's primary image
  const getProductPrimaryImg = (prod) => {
    if (!prod) return '';
    if (Array.isArray(prod.images) && prod.images.length > 0 && prod.images[0]) {
      return typeof prod.images[0] === 'string' ? prod.images[0] : prod.images[0].url || prod.images[0].image_url || '';
    }
    if (Array.isArray(prod.colors) && prod.colors[0] && Array.isArray(prod.colors[0].images) && prod.colors[0].images[0]) {
      const c0 = prod.colors[0].images[0];
      return typeof c0 === 'string' ? c0 : c0.url || c0.image_url || '';
    }
    if (typeof prod.image === 'string' && prod.image.trim().length > 0) return prod.image;
    return '';
  };

  // Initialize Items array whenever piecesCount or mode changes
  const initItemsForPieces = (count, mode, currentSelectedIds = selectedProductIds) => {
    const itemsArr = [];
    let calcOriginalPrice = 0;

    for (let i = 0; i < count; i++) {
      if (mode === 'existing') {
        const prodId = currentSelectedIds[i] || '';
        const prod = productsCatalog.find(p => String(p.id) === String(prodId));
        if (prod) {
          calcOriginalPrice += Number(prod.price || 0);
          const primaryImg = getProductPrimaryImg(prod);
          itemsArr.push({
            pieceIndex: i + 1,
            pieceLabel: `Piece ${i + 1}: ${prod.name}`,
            productId: prod.id,
            name: prod.name,
            primaryImage: primaryImg,
            image: primaryImg,
            images: prod.images || (primaryImg ? [primaryImg] : []),
            colors: prod.colors || [{ name: 'Default', hex: '#111111', images: prod.images }],
            sizes: prod.sizes || ['S', 'M', 'L', 'XL']
          });
        } else {
          itemsArr.push({
            pieceIndex: i + 1,
            pieceLabel: `Piece ${i + 1}: (Select Product)`,
            productId: '',
            name: '',
            colors: [],
            sizes: []
          });
        }
      } else {
        // Custom Mode
        itemsArr.push({
          pieceIndex: i + 1,
          pieceLabel: `Piece ${i + 1}`,
          productId: `custom-p${i + 1}`,
          name: '',
          colors: [],
          sizes: []
        });
      }
    }

    return { itemsArr, calcOriginalPrice };
  };

  const openModal = (mode, comboToEdit = null) => {
    setModalMode(mode);
    setEditingCombo(comboToEdit);

    if (comboToEdit) {
      setPiecesCount(comboToEdit.pieces_count || 2);
      const prodIds = ['', '', '', ''];
      comboToEdit.items?.forEach((item, idx) => {
        if (idx < 4) prodIds[idx] = item.productId || '';
      });
      setSelectedProductIds(prodIds);

      // Auto-populate primary images from catalog if missing in items
      const enrichedItems = (comboToEdit.items || []).map((it, idx) => {
        const catalogProd = productsCatalog.find(p => String(p.id) === String(it.productId));
        const pImg = it.primaryImage || it.image || getProductPrimaryImg(catalogProd) || comboToEdit.images?.[idx] || '';
        return {
          ...it,
          primaryImage: pImg,
          image: pImg
        };
      });

      const derivedImages = enrichedItems.map(it => it.primaryImage || it.image).filter(Boolean);

      const existingCats = Array.isArray(comboToEdit.categories) && comboToEdit.categories.length > 0
        ? comboToEdit.categories
        : (comboToEdit.category ? [comboToEdit.category] : []);
      const existingSlugs = Array.isArray(comboToEdit.category_slugs) && comboToEdit.category_slugs.length > 0
        ? comboToEdit.category_slugs
        : (comboToEdit.category_slug ? [comboToEdit.category_slug] : existingCats.map(c => c.toLowerCase().replace(/[^a-z0-9]+/g, '-')));
      const primaryCat = comboToEdit.category || existingCats[0] || '';
      const primarySlug = comboToEdit.category_slug || existingSlugs[0] || (primaryCat ? primaryCat.toLowerCase().replace(/[^a-z0-9]+/g, '-') : '');

      setFormData({
        id: comboToEdit.id,
        name: comboToEdit.name,
        slug: comboToEdit.slug || comboToEdit.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        category: primaryCat,
        category_slug: primarySlug,
        categories: existingCats,
        category_slugs: existingSlugs,
        subcategory: comboToEdit.subcategory || '',
        subcategory_slug: comboToEdit.subcategory_slug || '',
        pieces_count: comboToEdit.pieces_count || 2,
        offer_price: comboToEdit.offer_price,
        original_price: comboToEdit.original_price,
        badge: comboToEdit.badge || '',
        status: comboToEdit.status || 'Active',
        description: comboToEdit.description || '',
        cover_image: comboToEdit.cover_image || '',
        images: derivedImages.length > 0 ? derivedImages : (comboToEdit.images || []),
        is_existing_products_combo: comboToEdit.is_existing_products_combo ?? (mode === 'existing'),
        items: enrichedItems
      });
    } else {
      // New Combo
      const count = 2;
      setPiecesCount(count);
      const defaultIds = ['', '', '', ''];
      setSelectedProductIds(defaultIds);

      const { itemsArr, calcOriginalPrice } = initItemsForPieces(count, mode, defaultIds);
      const derivedImages = itemsArr.map(it => it.primaryImage || it.image).filter(Boolean);

      const defaultParentCat = comboCategories.find(c => !c.parent_id) || comboCategories[0];
      const initialCats = defaultParentCat?.name ? [defaultParentCat.name] : [];
      const initialSlugs = defaultParentCat?.slug ? [defaultParentCat.slug] : [];

      setFormData({
        id: `combo-${Date.now()}`,
        name: '',
        slug: '',
        category: defaultParentCat?.name || '',
        category_slug: defaultParentCat?.slug || '',
        categories: initialCats,
        category_slugs: initialSlugs,
        subcategory: '',
        subcategory_slug: '',
        pieces_count: count,
        offer_price: calcOriginalPrice > 0 ? Math.round(calcOriginalPrice * 0.7) : 0,
        original_price: calcOriginalPrice > 0 ? calcOriginalPrice : 0,
        badge: '',
        status: 'Active',
        description: '',
        cover_image: '',
        images: derivedImages,
        is_existing_products_combo: (mode === 'existing'),
        items: itemsArr
      });
    }

    setIsModalOpen(true);
  };

  // Handle Changing Piece Count (2, 3, or 4)
  const handlePiecesCountChange = (newCount) => {
    setPiecesCount(newCount);
    const { itemsArr, calcOriginalPrice } = initItemsForPieces(newCount, modalMode, selectedProductIds);
    const derivedImages = itemsArr.map(it => it.primaryImage || it.image).filter(Boolean);
    setFormData(prev => ({
      ...prev,
      pieces_count: newCount,
      original_price: calcOriginalPrice > 0 ? calcOriginalPrice : prev.original_price,
      offer_price: calcOriginalPrice > 0 ? Math.round(calcOriginalPrice * 0.7) : prev.offer_price,
      images: derivedImages.length > 0 ? derivedImages : prev.images,
      items: itemsArr
    }));
  };

  // Handle selecting an existing product for slot `slotIndex` (0, 1, 2, 3)
  const handleSelectProductForSlot = (slotIndex, prodId) => {
    const updatedIds = [...selectedProductIds];
    updatedIds[slotIndex] = prodId;
    setSelectedProductIds(updatedIds);

    const { itemsArr, calcOriginalPrice } = initItemsForPieces(piecesCount, 'existing', updatedIds);
    const derivedImages = itemsArr.map(it => it.primaryImage || it.image).filter(Boolean);

    setFormData(prev => ({
      ...prev,
      original_price: calcOriginalPrice > 0 ? calcOriginalPrice : prev.original_price,
      offer_price: calcOriginalPrice > 0 ? Math.round(calcOriginalPrice * 0.75) : prev.offer_price,
      images: derivedImages.length > 0 ? derivedImages : prev.images,
      items: itemsArr
    }));
  };

  // Save Combo to DB
  const handleSaveCombo = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.offer_price) {
      toast.error('Combo Name and Offer Price are required');
      return;
    }

    // Derive combo images from primary product images
    const derivedImages = formData.items
      ?.map(it => it.primaryImage || it.image)
      .filter(Boolean) || [];

    const finalImages = formData.cover_image
      ? [formData.cover_image, ...derivedImages.filter(img => img !== formData.cover_image)]
      : (derivedImages.length > 0 ? derivedImages : formData.images);

    // Generate clean SEO slug from name
    const cleanSlug = (formData.name || 'combo')
      .toLowerCase()
      .replace(/\s*\(copy(?:\s*\d+)?\)\s*/gi, '')
      .replace(/(?:-copy(?:-\d+)?)+/gi, '')
      .replace(/-\d{10,}.*/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'combo';

    const finalSlug = (!formData.slug || formData.slug.startsWith('combo-') || formData.slug.includes('copy') || (editingCombo && editingCombo.name !== formData.name))
      ? cleanSlug
      : formData.slug;

    const resolvedCats = Array.isArray(formData.categories) && formData.categories.length > 0
      ? formData.categories
      : (formData.category ? [formData.category] : []);
    const resolvedPrimaryCat = formData.category || resolvedCats[0] || '';

    const resolvedSlugs = resolvedCats.map(catName => {
      const matched = comboCategories.find(c => c.name?.toLowerCase().trim() === catName.toLowerCase().trim());
      return matched?.slug || catName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    });
    const primaryCatObj = comboCategories.find(c => c.name?.toLowerCase().trim() === resolvedPrimaryCat.toLowerCase().trim());
    const resolvedPrimarySlug = primaryCatObj?.slug || (resolvedPrimaryCat ? resolvedPrimaryCat.toLowerCase().replace(/[^a-z0-9]+/g, '-') : '');

    const finalCombo = {
      ...formData,
      category: resolvedPrimaryCat,
      category_slug: resolvedPrimarySlug,
      categories: resolvedCats,
      category_slugs: resolvedSlugs,
      cover_image: (formData.cover_image && typeof formData.cover_image === 'string') ? formData.cover_image.trim() : '',
      images: finalImages,
      pieces_count: piecesCount,
      slug: finalSlug
    };

    try {
      if (editingCombo) {
        const res = await api.put(`/combos/${editingCombo.id}`, finalCombo);
        if (res.data && res.data.success) {
          toast.success(`Combo "${formData.name}" updated successfully!`);
        }
      } else {
        const res = await api.post('/combos', finalCombo);
        if (res.data && res.data.success) {
          toast.success(`New ${piecesCount}-piece combo "${formData.name}" created successfully!`);
        }
      }
      loadData();
      window.dispatchEvent(new CustomEvent('orderly_combos_updated'));
      setIsModalOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save combo');
    }
  };

  // Delete Combo
  const handleDeleteCombo = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete combo "${name}"?`)) {
      try {
        const res = await api.delete(`/combos/${id}`);
        if (res.data && res.data.success) {
          toast.success(`Combo "${name}" removed from catalog.`);
          setCombos(prev => prev.filter(c => String(c.id) !== String(id) && String(c.slug) !== String(id)));
          loadData();
          window.dispatchEvent(new CustomEvent('orderly_combos_updated'));
        }
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to delete combo.');
      }
    }
  };

  // Duplicate Combo - mirrors ProductsList handleDuplicateProduct
  const handleDuplicateCombo = async (combo) => {
    try {
      // 1. Clean base name (strip any existing (Copy ...) tags)
      const baseName = (combo.name || 'Combo')
        .replace(/\s*\((?:Copy(?:\s*\d+)?)\)$/i, '')
        .trim();

      // Determine next copy number cleanly
      const existingCopies = combos.filter(c => {
        const cName = (c.name || '').trim();
        const regex = new RegExp(`^${baseName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:\\s*\\(Copy(?:\\s*(\\d+))?\\))?$`, 'i');
        return regex.test(cName);
      });

      let nextCopyNum = 1;
      if (existingCopies.length > 0) {
        existingCopies.forEach(c => {
          const match = (c.name || '').match(/\(Copy(?:\s*(\d+))?\)/i);
          if (match) {
            const num = match[1] ? parseInt(match[1], 10) : 1;
            if (num >= nextCopyNum) nextCopyNum = num + 1;
          }
        });
      }
      const duplicateName = nextCopyNum === 1 ? `${baseName} (Copy)` : `${baseName} (Copy ${nextCopyNum})`;

      // 2. Clean base slug from baseName without copy or timestamps
      const baseSlug = baseName
        .toLowerCase()
        .replace(/\s*\(copy(?:\s*\d+)?\)\s*/gi, '')
        .replace(/(?:-copy(?:-\d+)?)+/gi, '')
        .replace(/-\d{10,}.*/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') || 'combo';

      let candidateSlug = baseSlug;
      let slugCounter = 1;
      while (combos.some(c => (c.slug || '').toLowerCase() === candidateSlug.toLowerCase())) {
        slugCounter++;
        candidateSlug = `${baseSlug}-${slugCounter}`;
      }

      const duplicateData = {
        ...combo,
        id: `combo-${Date.now()}`,
        name: duplicateName,
        slug: candidateSlug,
        status: 'Inactive'
      };

      delete duplicateData.createdAt;
      delete duplicateData.updatedAt;
      delete duplicateData.deleted;

      const res = await api.post('/combos', duplicateData);
      if (res.data && res.data.success && res.data.data) {
        const savedCombo = res.data.data;
        toast.success(`Combo "${savedCombo.name}" duplicated successfully!`);
        loadData();
        window.dispatchEvent(new CustomEvent('orderly_combos_updated'));
      } else {
        toast.error('Failed to duplicate combo');
      }
    } catch (err) {
      console.warn('Duplicate combo error:', err.message);
      toast.error(err.response?.data?.message || 'Failed to duplicate combo');
    }
  };

  // Filter combos by search term, category & dropdown filters
  const filteredCombos = combos.filter(c => {
    if (c.deleted) return false;

    const matchesSearch = 
      c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.badge?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (Array.isArray(c.categories) && c.categories.some(cat => cat?.toLowerCase().includes(searchTerm.toLowerCase()))) ||
      c.id?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesPiece = pieceFilter === 'All' || String(c.pieces_count || 2) === String(pieceFilter);
    const matchesMode = modeFilter === 'All' || 
      (modeFilter === 'existing' && c.is_existing_products_combo) ||
      (modeFilter === 'custom' && !c.is_existing_products_combo);

    const matchesCat = (() => {
      if (categoryFilter === 'All') return true;
      const catQuery = categoryFilter.toLowerCase().trim();
      
      const catObj = comboCategories.find(cat => 
        (cat.name && cat.name.toLowerCase().trim() === catQuery) ||
        (cat.slug && cat.slug.toLowerCase().trim() === catQuery)
      );

      const querySlug = (catObj?.slug || catQuery).toLowerCase().trim();
      const queryName = (catObj?.name || catQuery).toLowerCase().trim();

      const comboCats = Array.isArray(c.categories) && c.categories.length > 0
        ? c.categories.map(x => (x || '').toLowerCase().trim())
        : [ (c.category || '').toLowerCase().trim() ];
      const comboSlugs = Array.isArray(c.category_slugs) && c.category_slugs.length > 0
        ? c.category_slugs.map(x => (x || '').toLowerCase().trim())
        : [ (c.category_slug || '').toLowerCase().trim() ];

      const baseSlug = querySlug.replace(/-combos?$/g, '').replace(/combos?$/g, '').trim();

      return comboCats.some(cat => cat === queryName || cat === querySlug || cat.includes(querySlug) || (baseSlug && baseSlug.length > 2 && cat.includes(baseSlug))) ||
             comboSlugs.some(slug => slug === querySlug || slug === queryName || slug.includes(querySlug) || (baseSlug && baseSlug.length > 2 && slug.includes(baseSlug))) ||
             (baseSlug && baseSlug.length > 2 && (c.name || '').toLowerCase().includes(baseSlug));
    })();

    return matchesSearch && matchesPiece && matchesMode && matchesCat;
  });

  const isAllVisibleCombosSelected = filteredCombos.length > 0 && filteredCombos.every(c => selectedComboIds.includes(c.id));
  const isSomeVisibleCombosSelected = filteredCombos.some(c => selectedComboIds.includes(c.id)) && !isAllVisibleCombosSelected;

  const handleSelectAllCombos = (e) => {
    if (e.target.checked) {
      const visibleIds = filteredCombos.map(c => c.id);
      setSelectedComboIds(Array.from(new Set([...selectedComboIds, ...visibleIds])));
    } else {
      const visibleIdsSet = new Set(filteredCombos.map(c => c.id));
      setSelectedComboIds(selectedComboIds.filter(id => !visibleIdsSet.has(id)));
    }
  };

  const handleToggleComboSelect = (comboId, e) => {
    e.stopPropagation();
    setSelectedComboIds(prev => 
      prev.includes(comboId) ? prev.filter(id => id !== comboId) : [...prev, comboId]
    );
  };

  const handleSelectAllCombosCatalog = () => {
    setSelectedComboIds(combos.map(c => c.id));
  };

  const handleClearComboSelection = () => {
    setSelectedComboIds([]);
  };

  const handleApplyBulkComboCategory = async () => {
    const effectiveCats = bulkCategories.length > 0 ? bulkCategories : (bulkCategory ? [bulkCategory] : []);
    if (effectiveCats.length === 0) {
      toast.error('Please select at least one category');
      return;
    }
    setBulkLoading(true);
    try {
      const primaryCat = effectiveCats[0];
      const primaryCatObj = comboCategories.find(c => c.name?.toLowerCase().trim() === primaryCat.toLowerCase().trim());
      const primarySlug = primaryCatObj?.slug || primaryCat.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      
      const effectiveSlugs = effectiveCats.map(catName => {
        const matched = comboCategories.find(c => c.name?.toLowerCase().trim() === catName.toLowerCase().trim());
        return matched?.slug || catName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      });

      const res = await api.post('/combos/bulk-update', {
        ids: selectedComboIds,
        categoryMode: bulkCategoryMode,
        categories: effectiveCats,
        category_slugs: effectiveSlugs,
        updates: {
          category: primaryCat,
          category_slug: primarySlug,
          categories: effectiveCats,
          category_slugs: effectiveSlugs,
          subcategory: bulkSubcategory || null,
          subcategory_slug: bulkSubcategorySlug || (bulkSubcategory ? bulkSubcategory.toLowerCase().replace(/[^a-z0-9]+/g, '-') : null)
        }
      });
      if (res.data?.success) {
        toast.success(res.data.message || `Updated categories for ${selectedComboIds.length} combos`);
        const updatedMap = new Map((res.data.data || []).map(c => [c.id, c]));
        setCombos(prev => prev.map(c => {
          const up = updatedMap.get(c.id);
          return up ? { ...c, ...up } : c;
        }));
        setIsBulkCategoryModalOpen(false);
        setSelectedComboIds([]);
      } else {
        toast.error(res.data?.message || 'Failed to update category');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Error updating category');
    } finally {
      setBulkLoading(false);
    }
  };

  const handleApplyBulkComboPrice = async () => {
    const numVal = parseFloat(priceAdjustmentValue);
    if (isNaN(numVal) || (priceAdjustmentType === 'fixed' && numVal < 0)) {
      toast.error('Please enter a valid price / adjustment value');
      return;
    }
    setBulkLoading(true);
    try {
      const res = await api.post('/combos/bulk-update', {
        ids: selectedComboIds,
        priceChange: {
          target: priceAdjustmentTarget,
          type: priceAdjustmentType,
          value: numVal
        }
      });
      if (res.data?.success) {
        toast.success(res.data.message || `Updated prices for ${selectedComboIds.length} combos`);
        const updatedMap = new Map((res.data.data || []).map(c => [c.id, c]));
        setCombos(prev => prev.map(c => {
          const up = updatedMap.get(c.id);
          return up ? { ...c, ...up } : c;
        }));
        setIsBulkPriceModalOpen(false);
        setSelectedComboIds([]);
      } else {
        toast.error(res.data?.message || 'Failed to update prices');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Error updating prices');
    } finally {
      setBulkLoading(false);
    }
  };

  // Calculate stats
  const activeCount = combos.filter(c => c.status === 'Active').length;
  const existingCount = combos.filter(c => c.is_existing_products_combo).length;
  const customCount = combos.filter(c => !c.is_existing_products_combo).length;

  return (
    <div className="combos-page p-4">
      {/* Top Title & Header Actions */}
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-4">
        <div>
          <h1 className="combos-header-title">
            <FiLayers className="text-warning" /> Combos & Bundles Management
          </h1>
          <p className="combos-header-sub">Create 2, 3, or 4-piece curated combo offers from existing catalog products or custom deals.</p>
        </div>

        <div className="d-flex align-items-center gap-2">
          <button 
            type="button" 
            className="btn-combo-primary"
            onClick={() => openModal('existing')}
          >
            <FiPlus /> Add Combo from Existing Products
          </button>
          <button 
            type="button" 
            className="btn-combo-secondary"
            onClick={() => openModal('custom')}
          >
            <FiPackage /> Add Custom Combo
          </button>
        </div>
      </div>

      {/* 4 Stat Overview Cards */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="combo-stat-card">
            <div>
              <div className="combo-stat-label">ACTIVE COMBOS</div>
              <div className="combo-stat-val">{activeCount}</div>
            </div>
            <div className="combo-stat-icon emerald">
              <FiLayers />
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div className="combo-stat-card">
            <div>
              <div className="combo-stat-label">CATALOG BUNDLES</div>
              <div className="combo-stat-val">{existingCount}</div>
            </div>
            <div className="combo-stat-icon indigo">
              <FiGrid />
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div className="combo-stat-card">
            <div>
              <div className="combo-stat-label">CUSTOM DEALS</div>
              <div className="combo-stat-val">{customCount}</div>
            </div>
            <div className="combo-stat-icon gold">
              <FiBox />
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div className="combo-stat-card">
            <div>
              <div className="combo-stat-label">MAX BUNDLE PIECES</div>
              <div className="combo-stat-val">4 Items</div>
            </div>
            <div className="combo-stat-icon emerald">
              <FiPercent />
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar Filters Bar */}
      <div className="combo-toolbar-card mb-4">
        <div className="row g-3 align-items-center">
          <div className="col-md-3 col-lg-3">
            <div className="combo-search-wrapper">
              <FiSearch className="combo-search-icon" />
              <input 
                type="text" 
                className="combo-search-input"
                placeholder="Search combos by title, ID, badge..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="col-md-3 col-lg-3">
            <select 
              className="combo-select-filter w-100"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="All">All Combo Categories</option>
              {comboCategories.filter(cat => !cat.parent_id).map(cat => (
                <option key={cat.id || cat.slug} value={cat.name}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div className="col-md-3 col-lg-3">
            <select 
              className="combo-select-filter w-100"
              value={pieceFilter}
              onChange={(e) => setPieceFilter(e.target.value)}
            >
              <option value="All">All Piece Bundles</option>
              <option value="2">2-Piece Deals</option>
              <option value="3">3-Piece Deals</option>
              <option value="4">4-Piece Deals</option>
            </select>
          </div>

          <div className="col-md-3 col-lg-3">
            <select 
              className="combo-select-filter w-100"
              value={modeFilter}
              onChange={(e) => setModeFilter(e.target.value)}
            >
              <option value="All">All Creation Modes</option>
              <option value="existing">Existing Products</option>
              <option value="custom">Custom Bundles</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedComboIds.length > 0 && (
        <div className="mb-3 p-3 d-flex flex-wrap align-items-center justify-content-between gap-3 shadow-sm" style={{ background: '#0f172a', color: '#ffffff', borderRadius: '8px', border: '1px solid #1e293b' }}>
          <div className="d-flex align-items-center gap-3 flex-wrap">
            <div className="d-flex align-items-center gap-2">
              <span className="badge bg-danger fs-6 px-3 py-1 fw-bold">{selectedComboIds.length}</span>
              <span className="fw-semibold text-white">Combo{selectedComboIds.length > 1 ? 's' : ''} Selected</span>
            </div>
            <button 
              type="button" 
              className="btn btn-sm btn-outline-light py-1 px-2" 
              style={{ fontSize: '12px' }}
              onClick={handleSelectAllCombosCatalog}
            >
              Select All in Catalog ({combos.length})
            </button>
            <button 
              type="button" 
              className="btn btn-sm btn-link text-white-50 text-decoration-none py-1 px-1" 
              style={{ fontSize: '12px' }}
              onClick={handleClearComboSelection}
            >
              Clear Selection
            </button>
          </div>

          <div className="d-flex align-items-center gap-2 flex-wrap">
            <button 
              type="button" 
              className="btn btn-sm btn-light fw-bold d-flex align-items-center gap-2 px-3 py-2"
              style={{ borderRadius: '6px' }}
              onClick={() => {
                const topCats = comboCategories.filter(c => !c.parent_id);
                setBulkCategory(topCats[0]?.name || '');
                setBulkCategorySlug(topCats[0]?.slug || '');
                setBulkCategories(topCats[0]?.name ? [topCats[0].name] : []);
                setBulkCategoryMode('replace');
                setBulkSubcategory('');
                setBulkSubcategorySlug('');
                setIsBulkCategoryModalOpen(true);
              }}
            >
              <FiFolder className="text-warning" /> Category Setup
            </button>
            <button 
              type="button" 
              className="btn btn-sm btn-danger fw-bold d-flex align-items-center gap-2 px-3 py-2"
              style={{ borderRadius: '6px' }}
              onClick={() => {
                setPriceAdjustmentType('fixed');
                setPriceAdjustmentTarget('offer_price');
                setPriceAdjustmentValue('');
                setIsBulkPriceModalOpen(true);
              }}
            >
              <FiDollarSign /> Price Change Options
            </button>
          </div>
        </div>
      )}

      {/* Combos Data Table */}
      <div className="combo-table-card">
        <div className="table-responsive">
          <table className="admin-matrix-table align-middle mb-0">
            <thead>
              <tr>
                <th style={{ width: '40px', textAlign: 'center', paddingLeft: '16px' }}>
                  <input 
                    type="checkbox" 
                    className="form-check-input"
                    checked={isAllVisibleCombosSelected}
                    ref={el => { if (el) el.indeterminate = isSomeVisibleCombosSelected; }}
                    onChange={handleSelectAllCombos}
                    title="Select/Deselect all visible combos"
                    style={{ cursor: 'pointer', width: '17px', height: '17px' }}
                  />
                </th>
                <th className="ps-2 text-start" style={{ minWidth: '240px' }}>COMBO OFFER</th>
                <th className="text-start" style={{ minWidth: '150px' }}>CATEGORY</th>
                <th className="text-center" style={{ minWidth: '95px' }}>PIECES</th>
                <th className="text-center" style={{ minWidth: '140px' }}>MODE</th>
                <th className="text-end" style={{ minWidth: '110px' }}>ORIGINAL PRICE</th>
                <th className="text-end" style={{ minWidth: '110px' }}>OFFER PRICE</th>
                <th className="text-center" style={{ minWidth: '120px' }}>SAVINGS BADGE</th>
                <th className="text-center" style={{ minWidth: '90px' }}>STATUS</th>
                <th className="text-end pe-4" style={{ minWidth: '130px' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="10" className="text-center py-5">
                    <span className="spinner-border spinner-border-sm text-danger me-2" role="status" /> Loading combos catalog...
                  </td>
                </tr>
              ) : filteredCombos.length > 0 ? (
                filteredCombos.map(combo => (
                  <tr key={combo.id} style={{ background: selectedComboIds.includes(combo.id) ? '#f8fafc' : undefined }}>
                    <td style={{ textAlign: 'center', paddingLeft: '16px' }}>
                      <input 
                        type="checkbox" 
                        className="form-check-input"
                        checked={selectedComboIds.includes(combo.id)}
                        onChange={(e) => handleToggleComboSelect(combo.id, e)}
                        style={{ cursor: 'pointer', width: '17px', height: '17px' }}
                      />
                    </td>
                    <td className="ps-2 py-3 text-start">
                      <div className="d-flex align-items-center gap-3">
                        <div style={{ width: '56px', height: '56px', borderRadius: '6px', overflow: 'hidden', flexShrink: 0, border: '1px solid #cbd5e1' }}>
                          <ComboCover 
                            items={combo.items} 
                            images={combo.images} 
                            coverImage={combo.cover_image}
                            comboName={combo.name} 
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="combo-title-text text-truncate" style={{ maxWidth: '240px' }} title={combo.name}>{combo.name}</div>
                          <div className="d-flex align-items-center gap-1 mt-1">
                            <span className="combo-code-badge">{combo.id}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 text-start">
                      {(() => {
                        const cats = Array.isArray(combo.categories) && combo.categories.length > 0
                          ? combo.categories
                          : (combo.category ? [combo.category] : []);
                        if (cats.length === 0) {
                          return <span className="text-muted fst-italic extra-small">Unassigned</span>;
                        }
                        return (
                          <div className="d-flex flex-wrap gap-1 align-items-center">
                            {cats.map((cat, idx) => {
                              const isPrimary = cat === combo.category || idx === 0;
                              return (
                                <span 
                                  key={idx} 
                                  className={`badge ${isPrimary ? 'bg-danger text-white' : 'bg-light text-dark border'}`}
                                  style={{ fontSize: '0.74rem', fontWeight: 500 }}
                                  title={isPrimary ? 'Primary Category' : 'Assigned Category'}
                                >
                                  {isPrimary && <span className="me-1">★</span>}
                                  {cat}
                                </span>
                              );
                            })}
                          </div>
                        );
                      })()}
                      {combo.subcategory && (
                        <span className="badge bg-light text-secondary border extra-small mt-1 d-inline-block" style={{ fontSize: '0.72rem' }}>
                          ↳ {combo.subcategory}
                        </span>
                      )}
                    </td>
                    <td className="text-center">
                      <span className="badge-pieces">
                        {combo.pieces_count || 2} Pieces
                      </span>
                    </td>
                    <td className="text-center">
                      {combo.is_existing_products_combo ? (
                        <span className="badge-mode-existing">
                          <FiGrid /> Existing Catalog
                        </span>
                      ) : (
                        <span className="badge-mode-custom">
                          <FiBox /> Custom Deal
                        </span>
                      )}
                    </td>
                    <td className="text-end">
                      <span className="combo-price-original">₹{Number(combo.original_price || 0).toLocaleString()}</span>
                    </td>
                    <td className="text-end">
                      <strong className="combo-price-offer text-danger">₹{Number(combo.offer_price || 0).toLocaleString()}</strong>
                    </td>
                    <td className="text-center">
                      <span className="badge-savings-tag">
                        {combo.badge || 'SPECIAL DEAL'}
                      </span>
                    </td>
                    <td className="text-center">
                      <span className={`status-badge-pill ${combo.status === 'Active' ? 'active' : 'draft'}`}>
                        {combo.status || 'Active'}
                      </span>
                    </td>
                    <td className="text-end pe-4">
                      <div className="d-inline-flex gap-2">
                        <button 
                          type="button" 
                          className="btn-admin-outline py-1 px-2"
                          onClick={() => openModal(combo.is_existing_products_combo ? 'existing' : 'custom', combo)}
                          title="Edit Combo"
                        >
                          <FiEdit /> Edit
                        </button>
                        <button 
                          type="button" 
                          className="btn-admin-outline py-1 px-2"
                          onClick={() => handleDuplicateCombo(combo)}
                          title="Duplicate Combo"
                        >
                          <FiCopy /> Duplicate
                        </button>
                        <button 
                          type="button" 
                          className="btn-admin-outline py-1 px-2 text-danger"
                          onClick={() => handleDeleteCombo(combo.id, combo.name)}
                          title="Delete Combo"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="10" className="text-center py-5 text-muted">
                    <div className="py-4">
                      <FiLayers style={{ fontSize: '2.5rem', color: '#cbd5e1', marginBottom: '12px' }} />
                      <p className="fw-bold text-dark mb-1">No combo deals found</p>
                      <p className="small text-muted mb-3">Try adjusting your search criteria or create a new bundle deal.</p>
                      <button 
                        className="btn-combo-primary" 
                        onClick={() => openModal('existing')}
                      >
                        <FiPlus /> Add Combo Deal
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Combo Builder Modal */}
      {isModalOpen && (
        <div className="combo-modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="combo-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="combo-modal-header">
              <div>
                <h3 className="combo-modal-title">
                  <FiLayers className="text-danger" /> 
                  {editingCombo ? 'Edit Combo Deal' : modalMode === 'existing' ? 'Create Combo from Catalog Products' : 'Create Custom Combo Deal'}
                </h3>
                <span className="text-muted small">Configure bundle items, offer pricing, and promotional badges.</span>
              </div>
              <button 
                type="button" 
                className="combo-modal-close"
                onClick={() => setIsModalOpen(false)}
                title="Close"
              >
                <FiX />
              </button>
            </div>

            <form onSubmit={handleSaveCombo}>
              <div className="combo-modal-body">
                <div className="row g-3 mb-4">
                  {/* Pieces Count Selection (2, 3, or 4) */}
                  <div className="col-12">
                    <label className="admin-form-label">BUNDLE PIECES COUNT</label>
                    <div className="piece-count-selector">
                      {[2, 3, 4].map(num => (
                        <button
                          key={num}
                          type="button"
                          className={`piece-count-btn ${piecesCount === num ? 'active' : ''}`}
                          onClick={() => handlePiecesCountChange(num)}
                        >
                          <FiGrid /> {num} Pieces ({num} Items)
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Combo Title */}
                  <div className="col-md-6">
                    <label className="admin-form-label">Combo Offer Title *</label>
                    <input 
                      type="text" 
                      className="admin-input"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g. Resort Linen & Selvedge Denim 2-Piece Deal"
                    />
                  </div>

                  {/* Badge Tag */}
                  <div className="col-md-6">
                    <label className="admin-form-label">Savings Badge Tag</label>
                    <input 
                      type="text" 
                      className="admin-input"
                      value={formData.badge}
                      onChange={(e) => setFormData(prev => ({ ...prev, badge: e.target.value }))}
                      placeholder="e.g. SAVE 30% OFF"
                    />
                  </div>

                  {/* Multi-Category Selector for Combos */}
                  <div className="col-12">
                    <div className="d-flex align-items-center justify-content-between mb-1">
                      <label className="admin-form-label mb-0">COMBO CATEGORIES (Multiple Categories Allowed)</label>
                      <span className="text-muted extra-small">Click ★ on a badge to designate Primary Category</span>
                    </div>

                    {/* Selected Categories Display */}
                    <div className="p-2 border rounded bg-white mb-2 d-flex flex-wrap align-items-center gap-2" style={{ minHeight: '44px' }}>
                      {Array.isArray(formData.categories) && formData.categories.length > 0 ? (
                        formData.categories.map((cat, idx) => {
                          const isPrimary = cat === formData.category || (!formData.category && idx === 0);
                          return (
                            <span 
                              key={idx}
                              className={`badge d-inline-flex align-items-center gap-1 py-1.5 px-2.5 rounded-pill ${isPrimary ? 'bg-danger text-white' : 'bg-light text-dark border'}`}
                              style={{ fontSize: '0.82rem', fontWeight: 500 }}
                            >
                              <button
                                type="button"
                                className="btn p-0 border-0 me-1"
                                style={{ cursor: 'pointer', background: 'transparent', color: isPrimary ? '#fff' : '#b91c1c', fontSize: '0.76rem', textDecoration: 'none' }}
                                onClick={() => {
                                  const catObj = comboCategories.find(c => c.name === cat);
                                  setFormData(prev => ({ 
                                    ...prev, 
                                    category: cat,
                                    category_slug: catObj?.slug || cat.toLowerCase().replace(/[^a-z0-9]+/g, '-')
                                  }));
                                }}
                                title={isPrimary ? 'Current Primary Category' : 'Click to set as Primary Category'}
                              >
                                {isPrimary ? '★ Primary' : '☆ Make Primary'}
                              </button>
                              <span>{cat}</span>
                              <button
                                type="button"
                                className="btn p-0 border-0 ms-1"
                                style={{ cursor: 'pointer', background: 'transparent', color: isPrimary ? '#fff' : '#64748b' }}
                                onClick={() => {
                                  const nextCats = formData.categories.filter(c => c !== cat);
                                  const nextSlugs = formData.category_slugs?.filter((_, i) => formData.categories[i] !== cat) || [];
                                  const nextPrimary = isPrimary ? (nextCats[0] || '') : formData.category;
                                  const nextPrimaryObj = comboCategories.find(c => c.name === nextPrimary);
                                  setFormData(prev => ({
                                    ...prev,
                                    categories: nextCats,
                                    category_slugs: nextSlugs,
                                    category: nextPrimary,
                                    category_slug: nextPrimaryObj?.slug || (nextPrimary ? nextPrimary.toLowerCase().replace(/[^a-z0-9]+/g, '-') : '')
                                  }));
                                }}
                                title={`Remove ${cat}`}
                              >
                                <FiX size={13} />
                              </button>
                            </span>
                          );
                        })
                      ) : (
                        <span className="text-muted extra-small p-1">No categories assigned yet. Click any category below to add.</span>
                      )}
                    </div>

                    {/* Quick Category Add Pills */}
                    <div className="d-flex flex-wrap align-items-center gap-1.5 mb-2">
                      <span className="text-muted extra-small me-1">Available Categories:</span>
                      {comboCategories.filter(c => !c.parent_id).map((c, i) => {
                        const isSelected = Array.isArray(formData.categories) && formData.categories.includes(c.name);
                        return (
                          <button
                            key={i}
                            type="button"
                            className={`btn btn-sm py-0.5 px-2 rounded-pill ${isSelected ? 'btn-danger text-white' : 'btn-outline-secondary bg-white'}`}
                            style={{ fontSize: '0.78rem' }}
                            onClick={() => {
                              if (isSelected) {
                                const nextCats = formData.categories.filter(cat => cat !== c.name);
                                const nextSlugs = nextCats.map(name => {
                                  const obj = comboCategories.find(item => item.name === name);
                                  return obj?.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                                });
                                const nextPrimary = formData.category === c.name ? (nextCats[0] || '') : formData.category;
                                const nextPrimaryObj = comboCategories.find(item => item.name === nextPrimary);
                                setFormData(prev => ({
                                  ...prev,
                                  categories: nextCats,
                                  category_slugs: nextSlugs,
                                  category: nextPrimary,
                                  category_slug: nextPrimaryObj?.slug || (nextPrimary ? nextPrimary.toLowerCase().replace(/[^a-z0-9]+/g, '-') : '')
                                }));
                              } else {
                                const nextCats = [...(formData.categories || []), c.name];
                                const nextSlugs = nextCats.map(name => {
                                  const obj = comboCategories.find(item => item.name === name);
                                  return obj?.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                                });
                                const primaryCat = formData.category || c.name;
                                const primaryCatObj = comboCategories.find(item => item.name === primaryCat);
                                setFormData(prev => ({
                                  ...prev,
                                  categories: nextCats,
                                  category_slugs: nextSlugs,
                                  category: primaryCat,
                                  category_slug: primaryCatObj?.slug || (primaryCat ? primaryCat.toLowerCase().replace(/[^a-z0-9]+/g, '-') : '')
                                }));
                              }
                            }}
                          >
                            {isSelected ? `✓ ${c.name}` : `+ ${c.name}`}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Sub-Category */}
                  <div className="col-md-12">
                    <label className="admin-form-label">Sub-Category (Optional)</label>
                    {(() => {
                      const activeCatNames = Array.isArray(formData.categories) && formData.categories.length > 0
                        ? formData.categories.map(c => c.toLowerCase().trim())
                        : [String(formData.category || '').toLowerCase().trim()];
                      
                      const parentIds = comboCategories
                        .filter(c => activeCatNames.includes((c.name || '').toLowerCase().trim()) && !c.parent_id)
                        .map(c => Number(c.id));
                      
                      const subCats = comboCategories.filter(c => parentIds.includes(Number(c.parent_id)));
                      return (
                        <select
                          className="admin-input"
                          value={formData.subcategory || ''}
                          onChange={(e) => {
                            const subName = e.target.value;
                            const subCat = subCats.find(s => s.name === subName);
                            setFormData(prev => ({
                              ...prev,
                              subcategory: subName,
                              subcategory_slug: subCat?.slug || (subName ? subName.toLowerCase().replace(/[^a-z0-9]+/g, '-') : '')
                            }));
                          }}
                        >
                          <option value="">None (No Sub-Category)</option>
                          {subCats.map(sub => (
                            <option key={sub.id || sub.slug} value={sub.name}>{sub.name}</option>
                          ))}
                        </select>
                      );
                    })()}
                  </div>

                  {/* Pricing Row */}
                  <div className="col-md-3">
                    <label className="admin-form-label">Original Price Sum (₹)</label>
                    <input 
                      type="number" 
                      className="admin-input"
                      value={formData.original_price}
                      onChange={(e) => setFormData(prev => ({ ...prev, original_price: Number(e.target.value) }))}
                    />
                  </div>

                  <div className="col-md-3">
                    <label className="admin-form-label text-success">Offer Price (₹) *</label>
                    <input 
                      type="number" 
                      className="admin-input fw-bold fs-5 text-success"
                      required
                      value={formData.offer_price}
                      onChange={(e) => setFormData(prev => ({ ...prev, offer_price: Number(e.target.value) }))}
                    />
                  </div>

                  <div className="col-md-3">
                    <label className="admin-form-label">Status</label>
                    <select
                      className="admin-select"
                      value={formData.status}
                      onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>

                  {/* Combo Cover Image Upload Input */}
                  <div className="col-12 border-top pt-3 mt-3">
                    <FileUploadInput
                      label="COMBO COVER IMAGE (OPTIONAL - LEAVE BLANK TO SHOW PRODUCT PRIMARY IMAGE)"
                      folder="combos"
                      value={formData.cover_image || ''}
                      onChange={(url) => setFormData(prev => ({ ...prev, cover_image: url }))}
                      recommendedSize="Recommended: 800 x 1000 px (3:4 Vertical Aspect Ratio, Max 10MB). Leave blank to show first product's primary image."
                      placeholder="Upload or paste Combo Cover Image URL (Optional)..."
                    />
                  </div>

                  {/* Price Calculation Banner */}
                  {formData.original_price > 0 && formData.offer_price > 0 && (
                    <div className="col-12">
                      <div className="price-summary-banner">
                        <div className="d-flex align-items-center gap-2">
                          <FiPercent className="text-success fs-5" />
                          <span className="small text-dark fw-bold">
                            Combined MSRP: ₹{formData.original_price} &nbsp;➔&nbsp; Bundle Offer: ₹{formData.offer_price}
                          </span>
                        </div>
                        <span className="badge bg-success text-white px-3 py-1 fw-bold rounded-pill">
                          Customer Saves ₹{Math.max(0, formData.original_price - formData.offer_price)} ({Math.round(((formData.original_price - formData.offer_price) / formData.original_price) * 100)}% OFF)
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Description */}
                  <div className="col-12">
                    <label className="admin-form-label">Combo Description</label>
                    <textarea 
                      rows="2"
                      className="admin-textarea"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Brief description of what is included in this bundle deal..."
                    />
                  </div>
                </div>

                {/* PIECE SELECTION SECTION */}
                <div className="piece-config-box">
                  <h6 className="admin-form-label text-primary mb-3">
                    CONFIGURE {piecesCount} BUNDLE PIECES
                  </h6>

                  {modalMode === 'existing' ? (
                    /* EXISTING PRODUCTS PICKER */
                    <div className="row g-3">
                      {Array.from({ length: piecesCount }).map((_, idx) => (
                        <div key={idx} className="col-md-6 col-lg-4">
                          <div className="piece-slot-card">
                            <div className="piece-slot-header">
                              PIECE {idx + 1} PRODUCT
                            </div>
                            <select 
                              className="admin-select mb-2"
                              value={selectedProductIds[idx] || ''}
                              onChange={(e) => handleSelectProductForSlot(idx, e.target.value)}
                            >
                              <option value="">-- Choose Catalog Product --</option>
                              {productsCatalog.map(prod => (
                                <option key={prod.id} value={prod.id}>
                                  {prod.name} (₹{prod.price})
                                </option>
                              ))}
                            </select>

                            {/* Selected Item Preview */}
                            {formData.items?.[idx]?.name ? (
                              <div className="piece-slot-preview">
                                <img 
                                  src={formData.items[idx].colors?.[0]?.images?.[0] || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=200&auto=format&fit=crop'} 
                                  alt={formData.items[idx].name} 
                                  className="piece-preview-img"
                                />
                                <div>
                                  <div className="fw-bold text-dark small line-clamp-1">{formData.items[idx].name}</div>
                                  <div className="text-muted extra-small" style={{ fontSize: '0.75rem' }}>
                                    Sizes: {formData.items[idx].sizes?.join(', ')}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="text-muted small italic mt-2" style={{ fontSize: '0.78rem' }}>
                                Choose a product above to import specs.
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    /* CUSTOM PIECES BUILDER WITH EXISTING PRODUCTS DROPDOWN */
                    <div className="row g-3">
                      {formData.items?.slice(0, piecesCount).map((item, idx) => (
                        <div key={idx} className="col-md-6 col-lg-4">
                          <div className="piece-slot-card">
                            <div className="piece-slot-header">
                              PIECE {idx + 1} PRODUCT SELECT
                            </div>

                            <label className="admin-form-label mb-1">Select Catalog Product *</label>
                            <select 
                              className="admin-select mb-2"
                              value={item.productId || selectedProductIds[idx] || ''}
                              onChange={(e) => handleSelectProductForSlot(idx, e.target.value)}
                            >
                              <option value="">-- Choose Existing Product --</option>
                              {productsCatalog.map(prod => (
                                <option key={prod.id} value={prod.id}>
                                  {prod.name} (₹{prod.price})
                                </option>
                              ))}
                            </select>

                            <label className="admin-form-label mb-1">Piece Title / Label</label>
                            <input 
                              type="text"
                              className="admin-input mb-2"
                              placeholder="Piece Name (e.g. Italian Linen Shirt)"
                              value={item.name || ''}
                              onChange={(e) => {
                                const updatedItems = [...formData.items];
                                updatedItems[idx].name = e.target.value;
                                setFormData(prev => ({ ...prev, items: updatedItems }));
                              }}
                            />
                            <div className="text-muted extra-small" style={{ fontSize: '0.75rem' }}>
                              Sizes: {item.sizes?.join(', ') || 'S, M, L, XL'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Auto-Generated Combo Cover Preview */}
                <div className="col-12 mt-3 px-1">
                  <div className="p-3 border rounded-3 bg-light">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <label className="admin-form-label mb-0 text-dark fw-bold">
                        COMBO COVER PREVIEW (Auto-generated from Selected Products)
                      </label>
                      <span className="badge bg-danger text-white">
                        {formData.items?.filter(it => it.name && (it.primaryImage || it.image)).length || 0} / {piecesCount} Primary Images Connected
                      </span>
                    </div>
                    <p className="text-muted small mb-3">
                      The cover is composed dynamically using the primary product image of each selected piece. Manual combo cover image upload is disabled to maintain catalog consistency.
                    </p>

                    <div style={{ maxWidth: '440px', height: '260px', margin: '0 auto', borderRadius: '8px', overflow: 'hidden', border: '1px solid #cbd5e1' }}>
                      <ComboCover
                        items={formData.items}
                        images={formData.images}
                        comboName={formData.name || 'Preview Combo'}
                        showPlusBadge={true}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons Footer */}
              <div className="d-flex justify-content-end gap-2 border-top border-slate-200 p-3 bg-light" style={{ borderBottomLeftRadius: '14px', borderBottomRightRadius: '14px' }}>
                <button 
                  type="button" 
                  className="btn-admin-outline" 
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-combo-primary"
                >
                  <FiCheck /> {editingCombo ? 'Save Combo Changes' : 'Publish Combo Deal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Combo Category Setup Modal */}
      {isBulkCategoryModalOpen && (
        <div className="admin-modal-backdrop" onClick={() => !bulkLoading && setIsBulkCategoryModalOpen(false)}>
          <div className="admin-modal-box" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header d-flex align-items-center justify-content-between pb-3 border-bottom">
              <h4 className="mb-0 font-weight-bold d-flex align-items-center gap-2" style={{ color: '#0f172a' }}>
                <FiFolder className="text-warning" /> Bulk Category Setup
              </h4>
              <button 
                type="button"
                className="admin-modal-close" 
                onClick={() => !bulkLoading && setIsBulkCategoryModalOpen(false)}
                disabled={bulkLoading}
              >
                <FiX />
              </button>
            </div>

            <div className="p-4">
              <p className="text-muted small mb-3">
                Update category and subcategory for the <strong>{selectedComboIds.length}</strong> selected combo{selectedComboIds.length > 1 ? 's' : ''}.
              </p>

              <div className="mb-3">
                <label className="admin-form-label fw-bold mb-1">SELECT CATEGORIES (Choose 1 or more)</label>
                <div className="d-flex flex-wrap gap-1.5 p-2 border rounded bg-white mb-2" style={{ maxHeight: '130px', overflowY: 'auto' }}>
                  {comboCategories.filter(c => !c.parent_id).map((c, i) => {
                    const isChecked = bulkCategories.includes(c.name) || (!bulkCategories.length && bulkCategory === c.name);
                    return (
                      <button
                        key={i}
                        type="button"
                        className={`btn btn-sm py-1 px-2.5 rounded-pill ${isChecked ? 'btn-danger text-white' : 'btn-outline-secondary bg-white'}`}
                        style={{ fontSize: '0.8rem' }}
                        onClick={() => {
                          setBulkCategories(prev => {
                            const base = prev.length > 0 ? prev : (bulkCategory ? [bulkCategory] : []);
                            if (base.includes(c.name)) {
                              const next = base.filter(x => x !== c.name);
                              setBulkCategory(next[0] || '');
                              setBulkCategorySlug(comboCategories.find(item => item.name === next[0])?.slug || '');
                              return next;
                            } else {
                              const next = [...base, c.name];
                              setBulkCategory(next[0] || '');
                              setBulkCategorySlug(comboCategories.find(item => item.name === next[0])?.slug || '');
                              return next;
                            }
                          });
                        }}
                      >
                        {isChecked ? `✓ ${c.name}` : `+ ${c.name}`}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mb-3">
                <label className="admin-form-label fw-bold mb-1">UPDATE MODE</label>
                <div className="d-flex gap-3">
                  <label className="d-flex align-items-center gap-1.5 cursor-pointer small">
                    <input 
                      type="radio" 
                      name="bulkComboCatMode" 
                      checked={bulkCategoryMode === 'replace'} 
                      onChange={() => setBulkCategoryMode('replace')} 
                    />
                    <span><strong>Replace</strong> existing categories</span>
                  </label>
                  <label className="d-flex align-items-center gap-1.5 cursor-pointer small">
                    <input 
                      type="radio" 
                      name="bulkComboCatMode" 
                      checked={bulkCategoryMode === 'append'} 
                      onChange={() => setBulkCategoryMode('append')} 
                    />
                    <span><strong>Add / Append</strong> to existing</span>
                  </label>
                </div>
              </div>

              <div className="mb-3">
                <label className="admin-form-label fw-bold mb-1">SUB-CATEGORY (Optional)</label>
                {(() => {
                  const effectiveCats = bulkCategories.length > 0 ? bulkCategories : (bulkCategory ? [bulkCategory] : []);
                  const catNamesLower = effectiveCats.map(c => c.toLowerCase().trim());
                  const parentIds = comboCategories
                    .filter(c => catNamesLower.includes((c.name || '').toLowerCase().trim()) && !c.parent_id)
                    .map(c => Number(c.id));
                  const subCategories = comboCategories.filter(c => parentIds.includes(Number(c.parent_id)));
                  return (
                    <select 
                      className="admin-select w-100"
                      value={bulkSubcategory}
                      onChange={(e) => {
                        const subName = e.target.value;
                        const subCat = subCategories.find(s => s.name === subName);
                        setBulkSubcategory(subName);
                        setBulkSubcategorySlug(subCat?.slug || (subName ? subName.toLowerCase().replace(/[^a-z0-9]+/g, '-') : ''));
                      }}
                      disabled={effectiveCats.length === 0}
                    >
                      <option value="">None (No Sub-Category / Clear Subcategory)</option>
                      {subCategories.map((sub, idx) => (
                        <option key={idx} value={sub.name}>{sub.name}</option>
                      ))}
                    </select>
                  );
                })()}
              </div>

              <div className="alert alert-light border small text-secondary mt-3 mb-0">
                <strong>Selection:</strong> Will {bulkCategoryMode} Categories: <code>{(bulkCategories.length > 0 ? bulkCategories : (bulkCategory ? [bulkCategory] : [])).join(', ') || 'None'}</code>{bulkSubcategory ? <span> and Subcategory: <code>{bulkSubcategory}</code></span> : ''} on <strong>{selectedComboIds.length}</strong> combos.
              </div>
            </div>

            <div className="admin-modal-footer d-flex justify-content-end gap-2 p-3 border-top bg-light">
              <button 
                type="button" 
                className="btn btn-sm btn-secondary px-3" 
                onClick={() => setIsBulkCategoryModalOpen(false)}
                disabled={bulkLoading}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="btn btn-sm btn-danger px-4 fw-bold" 
                onClick={handleApplyBulkComboCategory}
                disabled={bulkLoading || (bulkCategories.length === 0 && !bulkCategory)}
              >
                {bulkLoading ? 'Applying...' : `Apply to ${selectedComboIds.length} Combos`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Combo Price Adjustment Modal */}
      {isBulkPriceModalOpen && (
        <div className="admin-modal-backdrop" onClick={() => !bulkLoading && setIsBulkPriceModalOpen(false)}>
          <div className="admin-modal-box" style={{ maxWidth: '620px' }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header d-flex align-items-center justify-content-between pb-3 border-bottom">
              <h4 className="mb-0 font-weight-bold d-flex align-items-center gap-2" style={{ color: '#0f172a' }}>
                <FiDollarSign className="text-danger" /> Bulk Price Change Options
              </h4>
              <button 
                type="button"
                className="admin-modal-close" 
                onClick={() => !bulkLoading && setIsBulkPriceModalOpen(false)}
                disabled={bulkLoading}
              >
                <FiX />
              </button>
            </div>

            <div className="p-4">
              <p className="text-muted small mb-3">
                Adjust prices across <strong>{selectedComboIds.length}</strong> selected combo{selectedComboIds.length > 1 ? 's' : ''}. Choose the target price field and adjustment formula.
              </p>

              <div className="row g-3 mb-3">
                <div className="col-md-6">
                  <label className="admin-form-label fw-bold mb-1">APPLY TO PRICE FIELD</label>
                  <select 
                    className="admin-select w-100"
                    value={priceAdjustmentTarget}
                    onChange={(e) => setPriceAdjustmentTarget(e.target.value)}
                  >
                    <option value="offer_price">Offer Price Only (₹)</option>
                    <option value="original_price">Original Price Only (₹)</option>
                    <option value="both">Both Offer Price & Original Price</option>
                  </select>
                </div>

                <div className="col-md-6">
                  <label className="admin-form-label fw-bold mb-1">ADJUSTMENT TYPE</label>
                  <select 
                    className="admin-select w-100"
                    value={priceAdjustmentType}
                    onChange={(e) => setPriceAdjustmentType(e.target.value)}
                  >
                    <option value="fixed">Set to Fixed Price (₹)</option>
                    <option value="increase_amount">Increase by Amount (+₹)</option>
                    <option value="decrease_amount">Decrease by Amount (-₹)</option>
                    <option value="increase_percent">Increase by Percentage (+%)</option>
                    <option value="decrease_percent">Decrease by Percentage (-%)</option>
                  </select>
                </div>
              </div>

              <div className="mb-3">
                <label className="admin-form-label fw-bold mb-1">
                  {priceAdjustmentType === 'fixed' && 'NEW FIXED PRICE (₹)'}
                  {priceAdjustmentType === 'increase_amount' && 'INCREASE AMOUNT (₹)'}
                  {priceAdjustmentType === 'decrease_amount' && 'DECREASE AMOUNT (₹)'}
                  {priceAdjustmentType === 'increase_percent' && 'INCREASE PERCENTAGE (%)'}
                  {priceAdjustmentType === 'decrease_percent' && 'DECREASE PERCENTAGE (%)'}
                </label>
                <div className="input-group">
                  <span className="input-group-text bg-white fw-bold">
                    {priceAdjustmentType.includes('percent') ? '%' : '₹'}
                  </span>
                  <input 
                    type="number" 
                    className="form-control"
                    placeholder={priceAdjustmentType.includes('percent') ? 'e.g. 10' : 'e.g. 1499'}
                    value={priceAdjustmentValue}
                    min="0"
                    step="any"
                    onChange={(e) => setPriceAdjustmentValue(e.target.value)}
                  />
                </div>
              </div>

              {/* Live Preview of first 3 combos */}
              {priceAdjustmentValue !== '' && !isNaN(parseFloat(priceAdjustmentValue)) && (
                <div className="card bg-light border p-3 mt-3">
                  <div className="fw-bold small text-dark mb-2">Live Price Calculation Preview (First 3 combos):</div>
                  <table className="table table-sm table-borderless mb-0 small">
                    <thead>
                      <tr className="text-muted border-bottom">
                        <th>Combo Name</th>
                        <th>Current Price</th>
                        <th>New Calculated Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedComboIds.slice(0, 3).map(id => {
                        const combo = combos.find(c => c.id === id);
                        if (!combo) return null;
                        const val = parseFloat(priceAdjustmentValue) || 0;
                        const calc = (curr) => {
                          let next = curr;
                          if (priceAdjustmentType === 'fixed') next = val;
                          else if (priceAdjustmentType === 'increase_amount') next = curr + val;
                          else if (priceAdjustmentType === 'decrease_amount') next = Math.max(0, curr - val);
                          else if (priceAdjustmentType === 'increase_percent') next = Math.round(curr * (1 + val / 100));
                          else if (priceAdjustmentType === 'decrease_percent') next = Math.round(curr * (1 - val / 100));
                          return Math.max(0, Math.round(next));
                        };
                        return (
                          <tr key={id}>
                            <td className="text-truncate" style={{ maxWidth: '200px' }}>{combo.name}</td>
                            <td>₹{combo.offer_price} {priceAdjustmentTarget !== 'offer_price' && combo.original_price ? `(Orig ₹${combo.original_price})` : ''}</td>
                            <td className="fw-bold text-success">
                              ₹{calc(Number(combo.offer_price) || 0)}
                              {priceAdjustmentTarget === 'both' && combo.original_price ? ` (Orig ₹${calc(Number(combo.original_price) || 0)})` : ''}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="admin-modal-footer d-flex justify-content-end gap-2 p-3 border-top bg-light">
              <button 
                type="button" 
                className="btn btn-sm btn-secondary px-3" 
                onClick={() => setIsBulkPriceModalOpen(false)}
                disabled={bulkLoading}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="btn btn-sm btn-danger px-4 fw-bold" 
                onClick={handleApplyBulkComboPrice}
                disabled={bulkLoading || priceAdjustmentValue === ''}
              >
                {bulkLoading ? 'Applying...' : `Update Prices for ${selectedComboIds.length} Combos`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CombosList;
