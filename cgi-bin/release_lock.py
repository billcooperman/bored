#!/usr/bin/env python
import cgi

fs = cgi.FieldStorage()
key = fs['id'].value.strip()
sesh = fs['sesh'].value.strip()
lock = open('./data/' + sesh + '/lock.txt').read().strip()
print "Content-type: application/JSON\n\n";
if lock == key:
    open('./data/' + sesh + '/lock.txt', 'w').write('X\n')
    print 'OK lock released'
else:
    print 'nice try... lock belongs to', lock
