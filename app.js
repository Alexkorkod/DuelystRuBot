var request = require('request'),
    fs = require('fs'),
    parsedContent, 
    card_list = [],
    card_image,
    card_label,
    card_manacost,
    card_attack,
    card_health,
    card_text;

request("https://duelystdb.com/card/all.json",
    function(error, response, body) {
      if (!error && response.statusCode === 200) {
        card_list = JSON.parse(body);
      }
    }
  );
const Discord = require('discord.js');
const bot = new Discord.Client();

card_list.forEach(function(item){
    item.label = item.label.toLowerCase();
});
bot.on('ready', () => {
  console.log('I am ready!');
});

bot.login(process.env.BOT_TOCKEN);

bot.on('message', message => {
    var re_hello = new RegExp("\\$(привет|hello|hi|list|commands|команды|bot|бот).*");
    if (message.content.toLowerCase().match(re_hello)) {
        message.channel.sendMessage("Привет! Я бот этого канала.\n"+
        "Пока что я умею рассказывать про карту, если написать ее название на английском, поставив перед ним символ $.\n"+
        "Если не помнишь название карты целиком - не беда, я пойму тебя даже по его части!\n"+
        "А еще, если напишешь $deck перед сообщением, я его скопирую в канал с колодами.");
    } else {
        checkMessageForBotContent(message);
    }
});

bot.on('guildMemberAdd', (guild, member) => {
    var channel = guild.channels.find("name","general");
    channel.sendMessage(member.user.toString()+" А что это за покемон?");
});

bot.on('error', (error) => {
  console.log(error);
});

var checkMessageForBotContent = function (message) {
    if (message.content.charAt(0) == "$") {
        if (checkMessageForDeck(message)) {
            //Do nothing, lul. Stud
        } else {
            checkMessageForCard(message);
        }
    }
}

var checkMessageForDeck = function (message) {
    var re_deck = new RegExp("\\$deck.*");
    if (message.content.toLowerCase().match(re_deck) && message.author.bot === false) {
        var deck_channel = message.guild.channels.find("name","decks");
        if (message.attachments.array().length > 0) {
            deck_channel.sendFile(message.attachments.array()[0]["url"]);
        }
        deck_channel.sendMessage(message.content.replace("$deck",""));
        return true;
    }
    return false;
}

var checkMessageForCard = function (message) {
    var chosen_cards_list = [],
        counter = 0,
        out;
    card_list.forEach(function(item){
        var loweredContent = message.content.toLowerCase(),
            trimmedContent = loweredContent.replace("$",""),
            re = new RegExp(".*"+trimmedContent+".*");
        if (item.label.toLowerCase().match(re) && item.faction_id != 200) {
            chosen_cards_list[counter] = [];
            chosen_cards_list[counter].card_image = item.image;
            chosen_cards_list[counter].card_label = item.label;
            chosen_cards_list[counter].card_manacost = item.mana_cost;
            chosen_cards_list[counter].card_attack = item.attack;
            chosen_cards_list[counter].card_health = item.health;
            chosen_cards_list[counter].card_text = item.description;
            counter++;
        }
    });
    if (chosen_cards_list.length > 0 && message.author.bot === false) {
        out = checkCardsCollection(chosen_cards_list);
        if (typeof out === "string") {
            message.channel.sendMessage(out + "?");
        } else {
            message.channel.sendMessage(out.card_image+"\n"+
                out.card_label+" : "+
                out.card_manacost+" mana\n"+
                out.card_attack+"/"+
                out.card_health+"\n"+
                out.card_text); 
        }
    }
};

var checkCardsCollection = function(collection) {
    var out;
    collection = makeCollUnique(collection);
    if (Object.keys(collection).length == 1) {
        out = replaceHTML(collection[(Object.keys(collection)[0])]);
    } else {
        out = "";
        for (var item in collection) {
            if (collection[item].card_text !== "") {
                collection[item] = replaceHTML(collection[item]);
            }
            out = out + " или $" + collection[item].card_label;
        }
        out = out.replace(" или ","");
    }
    return out;
};

var makeCollUnique = function(collection) {
    var uniqueColl = [];
    collection.forEach(function(card) {
        if (!(card.card_label in uniqueColl)) {
            uniqueColl[card.card_label] = card;
        }
    });
    return uniqueColl;
};

var replaceHTML = function(item) {
    item.card_text = item.card_text.replace(/<b>/g,"");
    item.card_text = item.card_text.replace(/<\/b>/g,"");
    item.card_text = item.card_text.replace(/<br>/g,"\n");
    return item;
}