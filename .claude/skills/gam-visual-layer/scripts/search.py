#!/usr/bin/env python3
"""
GAM Visual Layer Search Tool
Search visual layer definitions for vBrain.io dashboard
"""

import csv
import sys
import os
import argparse
from pathlib import Path

def get_data_path():
    """Get path to data directory"""
    script_dir = Path(__file__).parent
    return script_dir.parent / "data"

def search_csv(file_path, query, columns_to_search=None):
    """Search CSV file for query terms"""
    results = []

    if not file_path.exists():
        return results

    with open(file_path, 'r', encoding='utf-8') as file:
        reader = csv.DictReader(file)
        for row in reader:
            # Convert query to lowercase for case-insensitive search
            query_lower = query.lower()

            # Search in specified columns or all columns
            search_columns = columns_to_search or row.keys()

            # Check if query matches any of the search columns
            match = False
            for col in search_columns:
                if col in row and query_lower in row[col].lower():
                    match = True
                    break

            if match:
                results.append(row)

    return results

def format_results(results, file_type):
    """Format search results for display"""
    if not results:
        return f"No {file_type} found for your query.\n"

    output = f"\n=== {file_type.upper()} RESULTS ===\n"

    for i, result in enumerate(results, 1):
        output += f"\n{i}. "

        if file_type == "layers":
            output += f"**{result['layer_name']}** (z-{result['z_index_range']})\n"
            output += f"   Purpose: {result['purpose']}\n"
            output += f"   Components: {result['components']}\n"
            output += f"   Context: {result['usage_context']}\n"

        elif file_type == "compositions":
            output += f"**{result['composition_name']}**\n"
            output += f"   Pattern: {result['layout_pattern']}\n"
            output += f"   Grid: {result['grid_structure']}\n"
            output += f"   Responsive: {result['responsive_behavior']}\n"
            output += f"   RTL: {result['rtl_support']}\n"

        elif file_type == "themes":
            output += f"**{result['theme_name']}**\n"
            output += f"   Primary: {result['primary_color']}\n"
            output += f"   Background: {result['background_color']}\n"
            output += f"   Context: {result['context']}\n"
            output += f"   CSS Vars: {result['css_vars']}\n"

        elif file_type == "patterns":
            output += f"**{result['pattern_name']}**\n"
            output += f"   Description: {result['description']}\n"
            output += f"   CSS: {result['css_classes']}\n"
            output += f"   Use Case: {result['use_case']}\n"
            output += f"   RTL: {result['rtl_considerations']}\n"

    return output

def main():
    parser = argparse.ArgumentParser(description='Search GAM Visual Layer definitions')
    parser.add_argument('query', help='Search query')
    parser.add_argument('--type', choices=['layers', 'compositions', 'themes', 'patterns', 'all'],
                       default='all', help='Type of data to search')
    parser.add_argument('--limit', type=int, default=10, help='Maximum results to show')

    args = parser.parse_args()

    data_path = get_data_path()
    query = args.query

    all_results = []

    # Search based on type
    if args.type in ['layers', 'all']:
        results = search_csv(data_path / "layers.csv", query)
        if results:
            output = format_results(results[:args.limit], "layers")
            print(output)
            all_results.extend(results)

    if args.type in ['compositions', 'all']:
        results = search_csv(data_path / "compositions.csv", query)
        if results:
            output = format_results(results[:args.limit], "compositions")
            print(output)
            all_results.extend(results)

    if args.type in ['themes', 'all']:
        results = search_csv(data_path / "themes.csv", query)
        if results:
            output = format_results(results[:args.limit], "themes")
            print(output)
            all_results.extend(results)

    if args.type in ['patterns', 'all']:
        results = search_csv(data_path / "patterns.csv", query)
        if results:
            output = format_results(results[:args.limit], "patterns")
            print(output)
            all_results.extend(results)

    if not all_results:
        print(f"\nNo visual layer definitions found for: '{query}'")
        print("\nTry searching for:")
        print("- Layer terms: background, content, interactive, navigation, overlay, alert")
        print("- Composition terms: dashboard, grid, modal, card, form, navigation")
        print("- Theme terms: professional, success, warning, error, hebrew, dark, light")
        print("- Pattern terms: glass, gradient, glow, stack, grid, border, floating")
        print("\nExample: python3 search.py 'dashboard grid'")

if __name__ == "__main__":
    main()