#!/usr/bin/env python
import cgi, json

fs = cgi.FieldStorage()
key = fs['id'].value.strip()
sesh = fs['sesh'].value.strip()
next_action = json.loads(fs['action'].value.strip())
lock = open('./data/' + sesh + '/lock.txt').read().strip()

print "Content-type: application/JSON\n\n";
if key == lock:
    f = open('./data/' + sesh + '/hist.txt', 'a')
    f.write(json.dumps(next_action) + '\n')

    # whoever wrote is up-to-date
    d = {s[0] : s[1] for s in map(lambda l : l.split(), open('./data/' + sesh + '/ids.txt').readlines())}
    d[key] = str(int(d[key])+1)
    open('./data/' + sesh + '/ids.txt', 'w').write('\n'.join(s + ' ' + d[s] for s in d) + '\n')

    print 'ok took action'
else:
    print 'nice try... lock belongs to', lock
