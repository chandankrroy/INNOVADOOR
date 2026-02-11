import sys

def trace_braces(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    depth = 0
    lines = content.split('\n')
    for i, line in enumerate(lines):
        line_num = i + 1
        for char in line:
            if char == '{':
                depth += 1
            elif char == '}':
                depth -= 1
        if depth < 0:
            print(f"ERROR: Negative depth {depth} at line {line_num}: {line.strip()}")
            return
    
    print(f"Final Depth: {depth}")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        trace_braces(sys.argv[1])
