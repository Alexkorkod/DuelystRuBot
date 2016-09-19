#!/usr/bin/python
from __future__ import print_function
import re
import lxml.html as html
from lxml import etree
from lxml.cssselect import CSSSelector
from array import *
pages = ['http://manaspring.ru/deckbuilder/Abyssian/#MTozMDE=',
    'http://manaspring.ru/deckbuilder/Lyonar/#MTox',
    'http://manaspring.ru/deckbuilder/Songhai/#MToxMDE=',
    'http://manaspring.ru/deckbuilder/Vetruvian/#MToyMDE=',
    'http://manaspring.ru/deckbuilder/Magmar/#MTo0MDE=',
    'http://manaspring.ru/deckbuilder/Vanar/#MTo1MDE=']
for page in pages:
    cur_page = html.parse(page)
    elist = cur_page.getroot().\
            find_class('card-item')
    f = open(page[33:page.rfind('/')]+".json",'w')
    print("[", file=f)
    cost = ''
    for i in elist:
        desc = i.find_class('card-description')
        att = i.find_class('attack')
        hp = i.find_class('hp')
        mana = i.find_class('mana-cost')
        l = i.find_class('card-name')
        img = i.find_class('card-image')
        card_type=i.find_class('card-type')
        r=i.find_class('card-rarity');
        for ii in r:
            tmp = etree.tostring(ii)
            rarity = tmp[24:len(tmp)-3]
        for ii in desc:
            descr = ii.text_content()
            descr = descr.replace("\"","'")
        for ii in att:
            at = ii.text_content()
        for ii in hp:
            health = ii.text_content()
        for ii in mana:
            cost = ii.text_content()
        for ii in l:
            label = ii.text_content()
            label = label.lower()
            space_inds = [m.start() for m in re.finditer(' ', label)]
            space_inds[:] = [x + 1 for x in space_inds]
            indices = set([0]+space_inds)
            label = "".join(c.upper() if i in indices else c for i, c in enumerate(label))
        for ii in img:
            image = etree.tostring(ii.cssselect('[src]').pop())
            image = "http://manaspring.ru/deckbuilder"+image[image.rfind("..")+2:len(image)-3]
            image = image.replace("?1","")
        for ii in card_type:
            c_type = ii.text_content()
        if c_type == 'Spell' or c_type == 'Artifact':
            at = ''
            health = ''
        if 'rarity' not in globals():
            rarity = ''
        print('{"label":"'+label+'","image":"'+image+'","rarity":"'+rarity+'","type":"'+c_type+'","description":"'+descr+'","attack":"'+at+'","health":"'+health+'","mana_cost":"'+cost+'"},', file=f)
    print("]", file=f)