'use strict'

var webJson = null;
var faqJson = null;

function processWebJson(data) {
    webJson = data;
    processData();
}

function processFaqJson(data) {
    faqJson = data;
    processData();
}


function rearangeData(data) {
    const result = [];

    for(let i = 0; i < data.length; i++ ) {
        const section = data[i];
        const questions = section.questions;
        for(let j = 0; j < questions.length; j++ ) {
            const question = questions[j];
            /*
            const info = {};
            info.anchor = question.anchor;
            info.section = question.anchor;
            */
            result[question.id] = { anchor: question.anchor , section:section.section_id};
        }
    }
    console.log(result);
    return result;
}

function processData() {
    if(webJson==null || faqJson==null) return;

    let result = [];
    const info = rearangeData(faqJson);
    const questions = webJson;

    for (let key in questions) {
        const row = [];
        if (key.startsWith("web.faq.questions.")) {
            const question = questions[key];
            row.push(key);
            row.push(question);

            if (key.endsWith(".question")) {
                //find section and kotvu
                const qId = key.substr("web.faq.questions.".length,key.length-27);
                //console.log(qId);
                const extra = info[qId];
                row.push(extra.anchor);
                row.push(extra.section);
            }
            
            result.push(row.join('\t'));
        }
    }

    document.getElementById("output").value = result.join('\n')

    const oneLines = [];
    for (let key in questions) {
        const row = [];
        if (key.startsWith("web.faq.questions.")) {
            const qId = key.substr("web.faq.questions.".length,key.indexOf(".",19)-18);
            //console.log(qId);
            let line = oneLines[qId];
            if (!line) {
                line = {};
                line.qId = qId;
                line.answes = [];
                oneLines[qId] = line;
            }

            if (key.endsWith(".question")) {
                const question = questions[key];
                //find section and kotvu
                const extra = info[qId];
                line.anchor = extra.anchor;
                line.section = extra.section;
                line.question = question;
            } else {
                line.answes.push(key);
            }
        }
    }
    console.log(oneLines);
    //doplneni otazek
    result = [];
    for (const key in oneLines) {
        const line = oneLines[key];
        //dopln 
        const oneAnswer = [];
        line.answes = line.answes.sort();
        for (const i in line.answes) {
            //console.log(line.answes[i]);
            oneAnswer.push(questions[line.answes[i]]);
        }
        //console.log(oneAnswer);
        //add to output 
        result.push([
            line.section,
            line.qId,
            line.anchor,
            line.question,
            oneAnswer.join(' ')
        ].join('\t'));
    }

    document.getElementById("output2").value = result.join('\n')


}


// Assign handlers immediately after making the request
window.onload = function () {

    var jqxhr = $.getJSON( "https://raw.githubusercontent.com/covid19cz/erouska-homepage/master/web.json", function() {
        console.log( "success" );
    })
    .done(function(data) {
        console.log( "second success" );
        //console.log(data);
        processWebJson(data);

    })
    .fail(function(jqxhr, textStatus, error) {
        console.log( "error" );
        console.log( "Request Failed: " + textStatus + ", " + error);
    })
    .always(function() {
        console.log( "complete" );
    });


    var jqxhr = $.getJSON( "https://raw.githubusercontent.com/covid19cz/erouska-homepage/master/assets/faq.json", function() {
        console.log( "success" );
    })
    .done(function(data) {
        console.log( "second success" );
        //console.log(data);
        processFaqJson(data);

    })
    .fail(function(jqxhr, textStatus, error) {
        console.log( "error" );
        console.log( "Request Failed: " + textStatus + ", " + error);
    })
    .always(function() {
        console.log( "complete" );
    });




}
