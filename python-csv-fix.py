#!/usr/bin/env python3
import csv
import sys

def fix_csv_file(input_file, output_file):
    print(f"🔧 Fixing CSV file: {input_file}")
    
    with open(input_file, 'r', encoding='utf-8') as infile:
        # Read all lines
        lines = infile.readlines()
    
    # Fix each line by removing nested quotes
    fixed_lines = []
    for i, line in enumerate(lines):
        # Replace problematic nested quotes
        fixed_line = line.replace('"utility"', 'utility')
        fixed_line = fixed_line.replace('"Utility"', 'Utility') 
        fixed_line = fixed_line.replace('"colibri"', 'colibri')
        fixed_lines.append(fixed_line)
    
    # Write the fixed content
    with open(output_file, 'w', encoding='utf-8') as outfile:
        outfile.writelines(fixed_lines)
    
    print(f"✅ Fixed CSV saved as: {output_file}")

if __name__ == "__main__":
    input_file = "/Users/mac/Documents/Zonemation/Transformation digital/Clients/KITMEDAPP/kitmed_batch_4_FINAL.csv"
    output_file = "/Users/mac/Documents/Zonemation/Transformation digital/Clients/KITMEDAPP/kitmed_batch_4_FINAL_python_fix.csv"
    fix_csv_file(input_file, output_file)