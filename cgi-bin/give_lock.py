#!/usr/bin/env python
import cgi, sys

fs = cgi.FieldStorage()
key = fs['id'].value.strip()
sesh = fs['sesh'].value.strip()

lock = open('./data/' + sesh + '/lock.txt').read().strip()
print "Content-type: application/JSON\n\n";
if lock == 'X':
    open('./data/' + sesh + '/lock.txt', 'w').write(key + '\n')
    print 'OK got lock for', key
else:
    print 'nice try... lock belongs to', lock

