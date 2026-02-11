import re
import sys

def extract_tags(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find all JSX-like tags
    tags = re.findall(r'<(div|/div|main|/main|table|/table|tbody|/tbody|tr|/tr|td|/td|thead|/thead|th|/th|span|/span|section|/section|article|/article|h[1-6]|/h[1-6]|p|/p|ul|/ul|ol|/ol|li|/li|button|/button|input|select|/select|option|/option|Link|/Link|Eye|Plus|ArrowLeft|ClipboardList|FileTextIcon|FileText|Check|Edit|Save|Trash2|X|Ruler|Building2|Calendar|Clock|User|Activity|AlertCircle|ChevronDown|ChevronUp|ChevronRight|Monitor|Smartphone|Tablet|Download|Printer|CheckCircle2|Clock3|AlertTriangle|Trash|Package|Globe|Truck|CreditCard|MapPin|Phone|Mail|Briefcase|Search|Info|HelpCircle|Settings|LogOut|Menu|ChevronLeft|ArrowRight|Bell|Maximize|Minimize|RefreshCcw|TrashIcon|Layout|Layers|HardDrive|Archive|BarChart|Zap|Tag|Shield|Lock|Unlock|Star|Heart|Send|MessageSquare|MessageCircle|Share2|Copy|MoreHorizontal|MoreVertical|Image|Video|Music|Mic|Headphones|Radio|Cast|Tv|Speaker|Play|Pause|Stop|SkipBack|SkipForward|Volume|Volume1|Volume2|VolumeX|Moon|Sun|Cloud|Wind|Droplet|Flame|Zap|ZapOff|Compass|Map|Pin|Flag|Home|Gift|ShoppingBag|ShoppingCart|CreditCard|Activity|Heart|Stethoscope|Syringe|Thermometer|Pill|Microscope|Brain|Flask|dna|genome|virus|test-tube|beaker|container|pipette|dropper|atom|atom-2|orbit|rocket|shuttle|satellite|telescope|microscope|ruler|compass|protractor|pencil|pen|brush|palette|paint-bucket|eraser|sticky-note|file|file-text|file-plus|file-minus|file-search|file-check|file-x|folder|folder-plus|folder-minus|folder-open|archive|hard-drive|cpu|database|server|cloud|cloud-rain|cloud-snow|cloud-lightning|cloud-drizzle|sun|moon|star|thermometer|wind|droplet|droplets|umbrella|zap|flame|tent|tree|mountain|waves|fish|bird|cat|dog|rabbit|hamster|paw|leaf|flower|sprout|tree-deciduous|tree-pine|clover|heart|star|shield|key|lock|unlock|bell|flag|anchor|crosshair|map-pin|map|compass|navigation|globe|send|mail|phone|smartphone|tablet|laptop|tv|monitor|camera|video|image|film|music|mic|headphones|radio|volume-2|volume-x|play|pause|stop|skip-back|skip-forward|rewind|fast-forward|repeat|shuffle|shuffle-2|maximize|minimize|external-link|link|link-2|unlink|plus|minus|check|x|more-horizontal|more-vertical|menu|search|settings|user|users|user-plus|user-minus|user-check|user-x|log-in|log-out|edit|edit-2|edit-3|clipboard|copy|save|trash|trash-2|archive|upload|download|share|share-2|heart|star|shield|key|lock|unlock|bell|flag|anchor|crosshair|map-pin|map|compass|navigation|globe|send|mail|phone|smartphone|tablet|laptop|tv|monitor|camera|video|image|film|music|mic|headphones|radio|volume-2|volume-x|play|pause|stop|skip-back|skip-forward|rewind|fast-forward|repeat|shuffle|shuffle-2|maximize|minimize|external-link|link|link-2|unlink|plus|minus|check|x|more-horizontal|more-vertical|menu|search|settings|user|users|user-plus|user-minus|user-check|user-x|log-in|log-out|edit|edit-2|edit-3|clipboard|copy|save|trash|trash-2|archive|upload|download|share|share-2)', content)
    
    stack = []
    print("Tracing tags for div, main, table...")
    for i, line in enumerate(content.split('\n')):
        line_num = i + 1
        found = re.findall(r'<(div|/div|main|/main|table|/table|tbody|/tbody|tr|/tr|td|/td|thead|/thead|th|/th|p|/p|span|/span|h1|/h1|h2|/h2|h3|/h3|h4|/h4|button|/button|select|/select|option|/option|Link|/Link)', line)
        for tag in found:
            if tag.startswith('/'):
                tag_name = tag[1:]
                if not stack:
                    print(f"Error: Unexpected closing tag </{tag_name}> at line {line_num}")
                else:
                    open_tag, open_line = stack.pop()
                    if open_tag != tag_name:
                        print(f"Error: Mismatched tag </{tag_name}> at line {line_num}, expected </{open_tag}> (from line {open_line})")
            else:
                # Check for self-closing tags like <div ... />
                if re.search(r'<' + tag + r'[^>]*/>', line):
                    continue
                stack.append((tag, line_num))
                
    if stack:
        print("Error: Unclosed tags at end of file:")
        for tag, line in stack:
            print(f"  <{tag}> from line {line}")
    else:
        print("All specified tags seem balanced.")

if __name__ == "__main__":
    extract_tags(sys.argv[1])
