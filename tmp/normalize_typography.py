import os
import re

def normalize_typography(directory):
    pattern = re.compile(r"fontWeight:\s*['\"](bold|500|600|700|800|900)['\"]")
    
    for root, dirs, files in os.walk(directory):
        if 'node_modules' in root or '.git' in root:
            continue
            
        for file in files:
            if file.endswith(('.tsx', '.ts', '.js')):
                path = os.path.join(root, file)
                try:
                    with open(path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    if pattern.search(content):
                        new_content = pattern.sub("fontWeight: '400'", content)
                        with open(path, 'w', encoding='utf-8') as f:
                            f.write(new_content)
                        print(f"Updated: {path}")
                except Exception as e:
                    print(f"Error processing {path}: {e}")

if __name__ == "__main__":
    normalize_typography(".")
