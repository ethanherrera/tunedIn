import React, { useState, useEffect, useRef } from 'react';
import { FiFilter } from 'react-icons/fi';
import genresData from '../../data/spotify-genres.json';
import './GenreSearch.css';

interface Genre {
  id: number;
  name: string;
}

interface ReviewWithTrack {
  id: string;
  genres?: string[];
  // Other fields not needed for this component
}

interface GenreSearchProps {
  onGenreSelect?: (genre: Genre) => void;
  buttonText?: string;
  className?: string;
  reviews?: ReviewWithTrack[];
}

const GenreSearch: React.FC<GenreSearchProps> = ({ 
  onGenreSelect, 
  buttonText = 'Search Genres',
  className = '',
  reviews = []
}) => {
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filteredGenres, setFilteredGenres] = useState<(Genre & { count?: number })[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);

  // Count how many reviews have each genre
  const getGenreCount = (genreName: string): number => {
    if (!reviews || reviews.length === 0) return 0;
    
    return reviews.filter(review => 
      review.genres && review.genres.some(g => 
        g.toLowerCase() === genreName.toLowerCase() || 
        g.toLowerCase().includes(genreName.toLowerCase())
      )
    ).length;
  };

  // Filter genres based on search term with improved prioritization
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredGenres([]);
      return;
    }

    const term = searchTerm.toLowerCase();
    
    // First, find exact matches
    const exactMatches = genresData.filter(
      (genre: Genre) => genre.name.toLowerCase() === term
    );
    
    // Second, find genres that start with the search term
    const startsWithMatches = genresData.filter(
      (genre: Genre) => 
        genre.name.toLowerCase().startsWith(term) && 
        genre.name.toLowerCase() !== term // Exclude exact matches
    );
    
    // Third, find genres that contain the search term but don't start with it
    const containsMatches = genresData.filter(
      (genre: Genre) => 
        genre.name.toLowerCase().includes(term) && 
        !genre.name.toLowerCase().startsWith(term) && 
        genre.name.toLowerCase() !== term // Exclude exact and starts with matches
    );
    
    // Combine all matches with priority order
    const allMatches = [...exactMatches, ...startsWithMatches, ...containsMatches]
      .slice(0, 10)
      .map(genre => ({
        ...genre,
        count: getGenreCount(genre.name)
      }));
    
    setFilteredGenres(allMatches);
  }, [searchTerm, reviews]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleGenreSelect = (genre: Genre) => {
    console.log('Selected genre:', genre);
    
    // Call the parent component's handler if provided
    if (onGenreSelect) {
      onGenreSelect(genre);
    }
    
    setIsSearchOpen(false);
    setSearchTerm('');
  };

  return (
    <div className={`genre-search-container ${className}`} ref={searchRef}>
      <button 
        className="genre-search-button"
        onClick={() => setIsSearchOpen(!isSearchOpen)}
      >
        <FiFilter className="button-icon" />
        {buttonText}
      </button>
      
      {isSearchOpen && (
        <div className="genre-search-dropdown">
          <input
            type="text"
            className="genre-search-input"
            placeholder="Search for a genre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoFocus
          />
          
          {filteredGenres.length > 0 && (
            <ul className="genre-results-list">
              {filteredGenres.map((genre) => (
                <li 
                  key={genre.id} 
                  className="genre-result-item"
                  onClick={() => handleGenreSelect(genre)}
                >
                  <span className="genre-name">{genre.name}</span>
                  {typeof genre.count === 'number' && (
                    <span className="genre-count">{genre.count}</span>
                  )}
                </li>
              ))}
            </ul>
          )}
          
          {searchTerm && filteredGenres.length === 0 && (
            <div className="no-results">No genres found</div>
          )}
        </div>
      )}
    </div>
  );
};

export default GenreSearch; 