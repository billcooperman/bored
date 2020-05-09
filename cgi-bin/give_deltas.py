#!/usr/bin/env python
import cgi, json

print "Content-type: application/JSON\n\n";
fs = cgi.FieldStorage()
key = fs['id'].value.strip()
sesh = fs['sesh'].value.strip()
d = {s[0] : s[1] for s in map(lambda l : l.split(), open('./data/' + sesh + '/ids.txt').readlines())}
if key in d:
    t = int(d[key])
    hist = open('./data/' + sesh + '/hist.txt').readlines()
    d[key] = str(len(hist))
    open('./data/' + sesh + '/ids.txt', 'w').write('\n'.join(s + ' ' + d[s] for s in d) + '\n')

    print '[' + ','.join(h.strip() for h in hist[t:]) + ']'
else:
    print 'error: id not found'
