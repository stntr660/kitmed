#!/usr/bin/env python3

def fix_csv_line(line):
    """Fix problematic nested quotes in CSV line"""
    # For line 11 specifically, manually fix the nested quotes
    if '9510,moria,surgery-instruments' in line:
        # Replace the entire problematic line
        return '9510,moria,surgery-instruments,"Castroviejo utility Pince(6.5-mm Platforms, 0.3-mm Oblique Teeth)","Castroviejo utility Forceps(6.5-mm Platforms, 0.3-mm Oblique Teeth)","Castroviejo Utility pince avec 0.3-mm oblique","Castroviejo Utility forceps with 0.3-mm oblique",,,,https://www.moria-surgical.com/media/cache/product_viewer/files/product/b52e3cf62d133816107a33dc932233a4fd4050e1.jpg,active,false\n'
    
    # Fix other potential issues
    # Remove quotes around specific words that cause parsing issues
    line = line.replace('"utility"', 'utility')
    line = line.replace('"Utility"', 'Utility')
    line = line.replace('"colibri"', 'colibri')
    
    return line

def fix_csv_file(input_file, output_file):
    print(f"🔧 Precisely fixing CSV file: {input_file}")
    
    with open(input_file, 'r', encoding='utf-8') as infile:
        lines = infile.readlines()
    
    fixed_lines = []
    for i, line in enumerate(lines, 1):
        fixed_line = fix_csv_line(line)
        fixed_lines.append(fixed_line)
        if i == 11:  # Check our fix worked
            print(f"Line 11 fixed: {fixed_line.strip()}")
    
    with open(output_file, 'w', encoding='utf-8') as outfile:
        outfile.writelines(fixed_lines)
    
    print(f"✅ Precisely fixed CSV saved as: {output_file}")

if __name__ == "__main__":
    input_file = "/Users/mac/Documents/Zonemation/Transformation digital/Clients/KITMEDAPP/kitmed_batch_4_FINAL.csv"
    output_file = "/Users/mac/Documents/Zonemation/Transformation digital/Clients/KITMEDAPP/kitmed_batch_4_FINAL_precise_fix.csv"
    fix_csv_file(input_file, output_file)