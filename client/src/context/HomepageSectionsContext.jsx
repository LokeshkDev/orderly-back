import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { getHomepageSections } from '../services/api';

const HomepageSectionsContext = createContext({
  sections: {},
  visible: () => true,
  getSection: () => null
});

export const useHomepageSections = () => useContext(HomepageSectionsContext);

export const HomepageSectionsProvider = ({ children }) => {
  const [sections, setSections] = useState({});

  const fetchSections = useCallback(async () => {
    try {
      const res = await getHomepageSections();
      if (res && res.success && Array.isArray(res.data)) {
        const map = {};
        res.data.forEach(s => { map[s.section_key] = s; });
        setSections(map);
      }
    } catch (err) {
      console.warn('Failed to load homepage sections:', err.message);
    }
  }, []);

  useEffect(() => {
    fetchSections();
    const handleUpdated = () => fetchSections();
    window.addEventListener('orderly_homepage_updated', handleUpdated);
    window.addEventListener('orderly_settings_updated', handleUpdated);
    window.addEventListener('storage', handleUpdated);
    return () => {
      window.removeEventListener('orderly_homepage_updated', handleUpdated);
      window.removeEventListener('orderly_settings_updated', handleUpdated);
      window.removeEventListener('storage', handleUpdated);
    };
  }, [fetchSections]);

  const visible = useCallback((key) => {
    const section = sections[key];
    return section ? section.is_visible !== false : true;
  }, [sections]);

  const getSection = useCallback((key) => sections[key] || null, [sections]);

  return (
    <HomepageSectionsContext.Provider value={{ sections, visible, getSection }}>
      {children}
    </HomepageSectionsContext.Provider>
  );
};
