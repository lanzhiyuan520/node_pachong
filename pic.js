var express = require('express')()
var page = 1   //爬取当前种子

var url = `http://www.doutula.com/photo/list/?page=`  //页数

var data = [];     //放置数据

var cheerio = require('cheerio')     //node端jquery
var schedule = require('node-schedule');
var myslq = require('mysql')
var connection = myslq.createConnection({
    host:'localhost',
    user : 'root',
    password : 'lanzhiyuan1201',
    database : 'lan'
})

let sql = (sentence) => {
    return new Promise((resolve,reject)=>{
        connection.query(sentence,(err,result)=>{
            if (err) {
                reject(err)
            }
            resolve(result)
        })
    })
}

var superagent = require('superagent')
var charset = require('superagent-charset');
charset(superagent)


let test = (url,page)=>{
    console.log('开始爬取')
    setTimeout(()=>{
        list(url,page)
    },1000)
}

let list = (url,page) => {
    superagent.get(`${url}${page}`).charset('').end((err,res)=>{
        if (err){
            console.log('出错啦')
            console.log(err)
            return err
        }
        console.log('开始爬取第'+page+'页')
        var $ = cheerio.load(res.text,{decodeEntities: false});
        $('.page-content a').each((index,item)=>{
            var url = $(item).children('.img-responsive').attr('data-original');
            var title = $(item).children('p').text()
            data.push({
                url,title
            })
        })

        if (page == 5){
            console.log('爬取完毕')
            insertdata()
        } else {
            list(url,++page)
        }
    })
}

let insertdata = async () => {
    for (var i = 0; i < data.length;i++) {
        let res = await sql(`select count(*) c from picture where url='${data[i].url}'`)
        if (res[0].c <= 0) {
           let result = await sql(`insert into picture(title,url) values('${data[i].title}','${data[i].url}')`)
           console.log('插入成功')
        } else {
            console.log(data[i].title + '-存在了')
        }
    }
}


var rule = new schedule.RecurrenceRule();
var hours = [1,5,9,13,17,21];
rule.hour = hours
const  scheduleCronstyle = ()=>{
    schedule.scheduleJob(rule,()=>{
        test(url,page)
    });
}


express.listen('30004',function () {
    console.log('启动成功')
    scheduleCronstyle()
})

//test(url,page)