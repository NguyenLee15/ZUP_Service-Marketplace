import os

path = r"d:\Đồ án tốt nghiệp\service-marketplace\fe\wed\app\(main)\services\page.tsx"
try:
    with open(path, 'rb') as f:
        content = f.read()
    
    # Try to decode as utf-8-sig (with BOM) or utf-8
    try:
        text = content.decode('utf-8-sig')
    except:
        text = content.decode('utf-8', errors='ignore')
    
    with open(path, 'w', encoding='utf-8') as f:
        f.write(text)
    print("Success")
except Exception as e:
    print(f"Error: {e}")
