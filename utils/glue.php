<?php
$factions_list = ['Abyssian','Lyonar','Magmar','Songhai','Vanar','Vetruvian'];
$res = [];
foreach ($factions_list as $faction) {
    $str = file_get_contents($faction.'.json');
    $arr = json_decode($str, TRUE);
    foreach ($arr as &$unit) {
        $str = $unit['description'];
        preg_match_all('/[A-Z]/', $str, $matches, PREG_OFFSET_CAPTURE);
        $matches = $matches[0];
        foreach ($matches as $match) {
            if ($match[1] !=0) {
                $pred_char = $str[$match[1]-1];
                if ($pred_char != ' ' && !ctype_upper($pred_char) && $pred_char != '-' && !is_numeric($pred_char) && $pred_char != '\'') {
                    $pos = strpos($str, $match[0]);
                    if ($pos !== false) {
                        $newstring = substr_replace($str, ' '.substr($str,$pos), $pos);
                        $unit['description'] = $newstring;
                    }
                }
            }
        }
        $matches = [];
    } 
    $res = array_merge($res, $arr);
}
$res = array_unique($res,SORT_REGULAR);
$res = array_values($res);
$json = json_encode($res,JSON_PRETTY_PRINT);
file_put_contents('../bd.json',$json);