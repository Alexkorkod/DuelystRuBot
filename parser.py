#!/usr/bin/python
from __future__ import print_function
import lxml.html as html
from lxml import etree
from lxml.cssselect import CSSSelector
page = html.parse('http://manaspring.ru/deckbuilder/Abyssian/#MTozMDE=')
elist = page.getroot().\
        find_class('card-item')
f = open('abyssian.json','w')
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
    for ii in desc:
        descr = ii.text_content()
    for ii in att:
        at = ii.text_content()
    for ii in hp:
        health = ii.text_content()
    for ii in mana:
        cost = ii.text_content()
    for ii in l:
        label = ii.text_content()
    for ii in img:
        image = etree.tostring(ii.cssselect('[src]').pop())
        image = "http://manaspring.ru/deckbuilder"+image[image.rfind("..")+2:len(image)-3]
    for ii in card_type:
        c_type = ii.text_content()
    if c_type == 'Spell' or c_type == 'Artifact':
        at = ''
        health = ''
    print('{"label":"'+label+'","image":"'+image+'","description":"'+descr+'","attack":"'+at+'","health":"'+health+'","mana_cost":"'+cost+'"},', file=f)
print("]", file=f)