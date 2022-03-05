import highestScores from "./services/highestScores";

async function main(){
  try{
    const {filePath, numberOfRecords} = parseAndValidateCommandLineArgumentsAreValid();
    const result = await highestScores.getHighestScores(filePath, numberOfRecords);
    console.log(`${JSON.stringify(result, null, 2)}`);
  }catch(e){
    console.error(e.message);
    process.exit(1);
  }
}

function parseAndValidateCommandLineArgumentsAreValid(){
  const args = process.argv.slice(2);
  const [filePath, numberOfRecordsString] = args;
  const numberOfRecords = parseInt(numberOfRecordsString);
  if(isNaN(numberOfRecords)){ throw new Error(`number of records param must be a number`); }
  if(numberOfRecords <= 0){ throw new Error(`number of records param must be greater than 0`); }
  return {numberOfRecords, filePath};
}

main();