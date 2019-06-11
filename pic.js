var express = require('express')()
var page = 1   //爬取当前页数
var page2 = 1
var url = `http://www.doutula.com/photo/list/?page=`  //url
var url2 = `https://www.fabiaoqing.com/biaoqing/lists/page/`
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

let test2 = (url,page) => {
    console.log('开始爬取')
    setTimeout(()=>{
        list2(url,page)
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
            console.log(data)
        } else {
            list(url,++page)
        }
    })
}

let list2 = (url,page) => {
    superagent.get(`${url}${page}.html`).charset('').end((err,res)=>{
        if (err){
            console.log('出错啦')
            console.log(err)
            return err
        }
        console.log('开始爬取第'+page+'页')
        var $ = cheerio.load(res.text,{decodeEntities: false});
        $('#container .tagbqppdiv').each((index,item)=>{
            var title = $(item).children('a').attr('title');
            var url = $(item).find('.image').attr('data-original')
            data.push({
                url,title
            })
        })

        if (page == 5){
            console.log('爬取完毕')
            insertdata()
            console.log(data)
        } else {
            list2(url2,++page2)
        }
    })
}

let insertdata = async () => {
     for (var i = 0; i < data.length;i++) {
        let res = await sql(`select count(*) c from picture where url='${data[i].url}'`)
        if (res[0].c <= 0) {
            try {
                let result = await sql(`insert into picture(title,url) values('${data[i].title}','${data[i].url}')`)
            }catch (e) {
                console.log('插入失败')
            }
           console.log('插入成功')
        } else {
            console.log(data[i].title + '-存在了')
        }
    }
}


var rule = new schedule.RecurrenceRule();
var rule2 = new schedule.RecurrenceRule();
var hours = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23];
rule.minute = 20
rule.hour = hours

rule2.hour = hours
rule2.minute = 40

const  scheduleCronstyle = ()=>{
    schedule.scheduleJob(rule,()=>{
        test(url,page)
        data = []
    });
    schedule.scheduleJob(rule2,()=>{
        test2(url2,page2)
        data = []
    });
}



express.listen('30004',function () {
    console.log('启动成功')
    scheduleCronstyle()
    //test2(url2,page2)
})

//test(url,page)