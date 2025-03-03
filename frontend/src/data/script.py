#!/usr/bin/env python3
import json
import re
import os
from collections import Counter

def process_word(word):
    """Process a word to standardize it."""
    # Convert to lowercase
    word = word.lower()
    
    # Remove any apostrophes, hyphens, and ampersands within words
    word = re.sub(r"['&-]", '', word)
    
    # Remove any non-alphanumeric characters
    word = re.sub(r"[^a-z0-9]", '', word)
    
    return word

def main():
    # Check if input file exists
    input_file = 'spotify-genres.json'
    if not os.path.exists(input_file):
        print(f"Error: Input file '{input_file}' not found.")
        return
    
    # Read the input JSON file
    with open(input_file, 'r', encoding='utf-8') as f:
        genres = json.load(f)
    
    # Extract unique words from all genres
    unique_words = set()
    word_counter = Counter()
    
    for genre in genres:
        # Split the genre name into words
        words = re.split(r'[\s\-&/]+', genre['name'])
        
        for word in words:
            processed_word = process_word(word)
            
            # Skip empty strings or very short words (less than 2 characters)
            if processed_word and len(processed_word) >= 2:
                unique_words.add(processed_word)
                word_counter[processed_word] += 1
    
    # Sort words alphabetically
    sorted_words = sorted(unique_words)
    
    # Create a new JSON structure with IDs
    unique_genres = []
    for i, word in enumerate(sorted_words, 1):
        unique_genres.append({
            "id": i,
            "name": word
        })
    
    # Save the result to a new JSON file
    output_file = 'unique-spotify-genre-words.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(unique_genres, f, indent=2)
    
    # Display statistics
    print(f"Total original genres: {len(genres)}")
    print(f"Total unique genre words: {len(unique_words)}")
    print("\nTop 30 most frequent genre words:")
    for word, count in word_counter.most_common(30):
        print(f"{word}: {count} occurrences")
    
    print(f"\nResults saved to '{output_file}'")
    
    # Optional: Create a frequency-based JSON file
    freq_output_file = 'frequency-sorted-genres.json'
    freq_genres = []
    for i, (word, count) in enumerate(word_counter.most_common(), 1):
        freq_genres.append({
            "id": i,
            "name": word,
            "frequency": count
        })
    
    with open(freq_output_file, 'w', encoding='utf-8') as f:
        json.dump(freq_genres, f, indent=2)
    
    print(f"Frequency-sorted genres saved to '{freq_output_file}'")

if __name__ == "__main__":
    main()