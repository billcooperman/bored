#!/usr/bin/env python
import cgi

fs = cgi.FieldStorage()
sesh = fs['sesh'].value.strip()
num = len(open('./data/' + sesh + '/ids.txt').readlines())
open('./data/' + sesh + '/ids.txt', 'a').write(str(num) + ' 0\n')

print "Content-type: application/JSON\n\n";
print num
