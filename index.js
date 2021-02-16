const { exec } = require('child_process');
const rp = require('request-promise');
const chalk = require('chalk');
const readline = require('readline-sync');
const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp')
let gitUser, gitAccessToken;
let projectMap = new Map();


start();

async function start() {
  console.log(chalk.green('--------------- *GITLAB REPOSITORY CLONNER V1* ---------------'));
  while (true) {
    gitUser = readline.question(chalk.yellow('Enter Your Gitlab Username : '))
    gitAccessToken = readline.question(chalk.yellow('Enter Your Gitlab Access Token : '))
    if (!gitUser.trim() || !gitAccessToken.trim()) {
      console.log(chalk.red('Please enter credentials'));
    } else {
      try{
        await printMenu();
      }
      catch(ex){
        console.log(ex);
        await printMenu();
      }
    }
  }

}

 async function printMenu() {
  console.log(chalk.green('--------------- *MENU* ---------------'));
  console.log(chalk.yellow('1. Clone Repository'));
  console.log(chalk.yellow('2. Exit'));
  let opt = readline.question(chalk.yellow('Select your option:'));
  switch (opt) {
    case '1':
      let projects = await callRestApi('GET', `https://gitlab.com/api/v4/projects?private_token=${gitAccessToken}&per_page=100&membership=true`)
      let iIndex = 1;
      console.log(chalk.green('You have following projects on gitlab : '))
      for (let project of projects) {
        let obj = {};
        obj['name'] = project.name;
        obj['path_with_namespace'] = project.path_with_namespace;
        obj['ssh_url_to_repo'] = project.ssh_url_to_repo;
        projectMap.set(project.name, obj);
        console.log(chalk.yellow(`${iIndex}. ${project.name}`))
        iIndex++;
      }
      let selectedProject = readline.question(chalk.yellow('Select your project1 : '));
      selectedProject = [...projectMap.values()][selectedProject - 1];
      let projectPath = path.join(path.parse(process.cwd()).root, selectedProject.path_with_namespace.substr(0, selectedProject.path_with_namespace.lastIndexOf("/")));
      const made = mkdirp.sync(projectPath);
      console.log('We are clonning selected repository for you hold on ...')
      let result = await localExec(`cd ${projectPath} && git clone ${selectedProject.ssh_url_to_repo}`);
      console.log(result);
      break;
      
      case '2':
      console.log('Exiting ...')
      process.exit();
  }
  await printMenu();
 }


async function localExec(cmd) {

  const result = { success: true, logs: '' };
  return new Promise((resolve, reject) => {
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        result.success = false;
        result.logs = 'Command:', cmd, '\nERROR Ocurred:', stderr;
      }
      result.logs += stdout + '\n' + stderr;
      resolve(result);
    });
  });
}

async function callRestApi(method, url, body, header) {
  try {
    const options = {
      method: method,
      uri: url,
      body: body,
      headers: header,
      json: true,
    };
    const result = await rp(options);
    return result;
  } catch (error) {
    throw error;
  }
}

