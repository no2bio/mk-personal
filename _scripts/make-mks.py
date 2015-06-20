#!/usr/bin/env python3
import csv
import json
import os

def mkmks(infile='data/mks.csv', outdir='_mks'):
    mkcsv = csv.reader(open(infile))
    labels = next(mkcsv)
    mks = {}
    for mk in mkcsv:
       d = dict(zip(labels,mk))
       filename = os.path.join(outdir,'{}.md'.format(d['alias']))
       if os.path.exists(filename):
           print('Skipping {}'.format(filename))
       else:
           open(filename,'w').write('---\nlayout: mk\n---\n')
           print('Wrote {}'.format(filename))

if __name__=='__main__':
    mkmks()
