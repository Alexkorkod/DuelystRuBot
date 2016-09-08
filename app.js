var request = require('request'),
    fs = require('fs'),
    parsedContent, 
    card_list = [],
    card_list_shimzar = [], 
    card_image,
    card_label,
    card_manacost,
    card_attack,
    card_health,
    card_text;

fs.readFile("./bd.json", (err, data) => {
  if (err) throw err;
  card_list = JSON.parse(data);
});
fs.readFile("./shimzar.json", (err, data) => {
  if (err) throw err;
  card_list_shimzar = JSON.parse(data);
});

const Discord = require('discord.js');
const bot = new Discord.Client();

card_list.forEach(function(item){
    item.label = item.label.toLowerCase();
});
bot.on('ready', () => {
  console.log('I am ready!');
});

bot.login(process.env.BOT_TOKEN);

bot.on('message', message => {
    var re_hello = new RegExp("^\\$(привет|hello|hi|list|commands|команды|bot|бот).*");
    if (message.content.toLowerCase().match(re_hello) && message.author.bot === false ) {
        message.channel.sendMessage("Привет! Я бот этого канала.\n"+
        "Я умею рассказывать про карту, если написать ее название на английском, поставив перед ним символ $.\n"+
        "Если не помнишь название карты целиком - не беда, я пойму тебя даже по его части!\n"+
        "Комманда $decklist выдаст тебе ссылку на свежие колоды.\n"+
        "А еще, если напишешь $deck перед сообщением, я его скопирую в канал \"decks\".");
    } else {
        checkMessageForBotContent(message);
    }
});

bot.on('guildMemberAdd', (guild, member) => {
    var channel = guild.channels.find("name","general");
    channel.sendMessage("Привет и добро пожаловать, " + member.user.toString()+ ".");
});

bot.on('error', (error) => {
  console.log(error);
});

var checkMessageForShimzar = function (message) {
    var out = [],
        counter = 1000;
    card_list_shimzar.forEach(function(item){
        var loweredContent = message.content.toLowerCase(),
            trimmedContent = loweredContent.replace("$",""),
            re = new RegExp(".*"+trimmedContent+".*");
        if (item.label.toLowerCase().match(re)){
            out[counter] = [];
            out[counter].url = item.url;
            out[counter].card_label = item.label;
            counter++;
        }
    });
    return out;
};

var checkMessageForBotContent = function (message) {
    if (message.content.charAt(0) == "$" && message.author.bot === false) {
        if (!checkMessageForDeckList(message)) {
            if (!checkMessageForDeck(message)) {
                if (!checkMessageForCard(message)){
                    message.channel.sendMessage("Извини, но такой команды я не знаю.\n"+
                        "Информацию обо мне можно посмотреть по команде $bot");
                }
            }
        }
    }
};

var checkMessageForDeckList = function (message) {
    var re_deck = new RegExp("^\\$decklist.*");
    if (message.content.toLowerCase().match(re_deck) && message.author.bot === false) {
        message.channel.sendMessage("Актуальные колоды можно посмотреть тут:\n"+
            "http://manaspring.ru/decklist/");
        return true;
    }
    return false;
};

var checkMessageForDeck = function (message) {
    var re_deck = new RegExp("^\\$deck.*");
    if (message.content.toLowerCase().match(re_deck) && message.author.bot === false) {
        var deck_channel = message.guild.channels.find("name","decks");
        if (message.attachments.array().length > 0) {
            deck_channel.sendFile(message.attachments.array()[0].url);
        }
        deck_channel.sendMessage(message.content.replace("$deck",""));
        return true;
    }
    return false;
};

var checkMessageForCard = function (message) {
    var chosen_cards_list = [],
        counter = 0,
        out;
    card_list.forEach(function(item){
        var loweredContent = message.content.toLowerCase(),
            trimmedContent = loweredContent.replace("$",""),
            re = new RegExp(".*"+trimmedContent+".*");
        if (item.label.toLowerCase().match(re)) {
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
    if (chosen_cards_list.length > 0) {
        out = checkCardsCollection(chosen_cards_list);
        if (typeof out === "string") {
            message.channel.sendMessage(out);
        } else {
            if (out.card_attack !== "") {
                reply = out.card_label+" : "+
                    out.card_manacost+" mana\n"+
                    out.card_attack+"/"+
                    out.card_health+"\n"+
                    out.card_text;
            } else {
                reply = out.card_label+" : "+
                    out.card_manacost+" mana\n"+
                    out.card_text;
            }
            message.channel.sendFile(out.card_image)
                .then(function(){message.channel.sendMessage(reply);});
        }
        return true;
    }
    return false;
};

var checkCardsCollection = function(collection) {
    var out,
        counter;
    collection = makeCollUnique(collection);
    if (Object.keys(collection).length == 1) {
        out = collection[(Object.keys(collection)[0])];
    } else {
        if (Object.keys(collection).length <= 5) {
            out = "";
            counter = 0;
            for (var item in collection) {
                if (counter == Object.keys(collection).length-1) {
                    out = out + " или $" + collection[item].card_label;
                } else { 
                    out = out + ", $" + collection[item].card_label;
                }
                counter++;
            }
            out = out.replace(", ","");
            out = out + "?";
        } else {
            out = "Слишком много карт совпадают с этим запросом.\n"+
            "Пожалуйста поконкретней.";
        }
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