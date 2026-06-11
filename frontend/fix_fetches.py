import os, re

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if 'fetch(' not in content:
        return
        
    print(f'Updating {filepath}')
    
    new_content = re.sub(r'\bfetch\(', 'fetchApi(', content)
    
    if 'fetchApi' in new_content and 'import { fetchApi }' not in new_content:
        import_stmt = 'import { fetchApi } from "@/lib/fetch-api";\n'
        
        lines = new_content.split('\n')
        if len(lines) > 0 and 'use client' in lines[0]:
            lines.insert(1, import_stmt)
        else:
            lines.insert(0, import_stmt)
            
        new_content = '\n'.join(lines)
        
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)

search_dir = r'c:\Users\omkar\Downloads\antg\neo-cloud-room\src\app'

for root, dirs, files in os.walk(search_dir):
    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts'):
            if '\\api\\' in root or '/api/' in root:
                continue
            process_file(os.path.join(root, file))
print('Done!')
