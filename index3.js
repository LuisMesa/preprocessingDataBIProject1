const parse = require('csv-parse');
const stringify = require('csv-stringify');
const fs = require('fs');

let emergencies, tempAndPres, matrix;

const readEmergencies = () => {
  return new Promise((resolve, reject) => {
    fs.readFile('./oldData/Emergencias_Naturales.csv', 'utf8', (err, data) => {
      if (err)
        reject();

      parse(data, {comment: '#'}, (err, output) => {
        output.splice(0, 1);
        emergencies = output.map((c, j) => {
          if (j === output.length - 1)
            resolve();

          return createEmergency(c);
        })
      });
    });
  });
};

const readTempAndPre = () => {
  return new Promise((resolve, reject) => {
    fs.readFile('./oldData/Precipitacion_y_Temperatura.csv', 'utf8', (err, data) => {
      if (err)
        reject();

      parse(data, {comment: '#'}, (err, output) => {
        output.splice(0, 1);
        tempAndPres = output.map((c, j) => {
          if (j === output.length - 1)
            resolve();
          return c;
        })
      });
    });
  });
};


const writeData = (data, path, columnNames) => {
  return new Promise((resolve, reject) => {
    const input = [
      columnNames ? columnNames : ['id', 'Anio', 'Mes', 'Departamento', 'Municipio', 'Evento', 'Altitud', 'PrecipitacionPromedio', 'TemperaturaPromedio'],
      ...data
    ];
    stringify(input, 'utf8', (err, output) => {
      fs.writeFile(path, output, 'utf8', (err) => {
        if (err) {
          console.log(err);
          reject();
        }
        console.log("The file was saved!");
        resolve();
      });
    })
  });
};

const merge = () => {
  return new Promise((resolve, reject) => {
    emergencies.forEach((e, i) => {
      addTempAndPresToEmergency(e);
      if (i === emergencies.length - 1)
        resolve();
    })
  })
};

const createEmergency = (oldEmergency) => {
  // Emergency : year,month,department,city,event, altitude,preciProm,tempProm
  return [
    oldEmergency[0].split(' ')[0].split('/')[2],
    oldEmergency[0].split(' ')[0].split('/')[0],
    clearString(oldEmergency[1]),
    clearString(oldEmergency[2]),
    oldEmergency[3].toUpperCase(),
  ]
};

let cont = 0;
const addTempAndPresToEmergency = (emergency) => {
  const tempAndPre = tempAndPres.find(tp => equalsNames(emergency[2], emergency[3], tp[3], tp[4]));
  if (tempAndPre) {
    emergency[5] = tempAndPre[14];
    emergency[6] = tempAndPre[14 + Number(emergency[1])];
    emergency[7] = tempAndPre[14 + 13 + Number(emergency[1])];
    console.log(cont++);
  }
};

const createCategoricalData = (oldData) => {
  const createCategoricalDataByProperty = (data, index, categories, denominator) => {
    return data.map(row => {
      switch (Math.floor(Number(row[index]) / denominator)) {
        case 0 :
          row[index] = categories[0];
          break;
        case 1 :
          row[index] = categories[1];
          break;
        case 2 :
          row[index] = categories[2];
          break;
        case 3 :
          row[index] = categories[3];
          break;
        case 4 :
          row[index] = categories[4];
          break;
        case 5 :
          row[index] = categories[5];
          break;
        case 6 :
          row[index] = categories[6];
          break;
        case 7 :
          row[index] = categories[7];
          break;
        case 8 :
          row[index] = categories[8];
          break;
      }
      return row;
    });
  };
  const categoriesAltitude = ['0-500', '500-1000', '1000-1500', '1500-2000', '2000-2500', '2500-3000', '3000-3500', '3500-4000', '4000-4500',];
  const categoriesPrecipitation = ['0-100', '100-200', '200-300', '300-400', '400-500', '500-600', '600-700', '700-800', '800-900',];
  const categoriesTemperature = ['0-5', '5-10', '10-15', '15-20', '20-25', '25-30', '30-35', '35-40', '40-45',];
  emergencies = createCategoricalDataByProperty(oldData, 5, categoriesAltitude, 500);
  emergencies = createCategoricalDataByProperty(oldData, 6, categoriesPrecipitation, 100);
  emergencies = createCategoricalDataByProperty(oldData, 7, categoriesTemperature, 5);
};

const filterByEvent = (event) => {
  return emergencies.map(e => {
      e[5] = e[5].includes(event) ? 'SI' : 'NO';
      return e;
    })
};

let id = 0;
const addIds = () => {
  emergencies = emergencies.map(e => {
    return [id++, ...e];
  })
};

const getNamesByIndex = (index) => {
  const names = [];
  emergencies.forEach(e => {
    const newName = e[index];
    if (!names.find(n => n === newName))
      names.push(newName);
  });
  return names;
};

const createMatrix = (columnNames) => {
  // console.log(columnNames.length);
  matrix = emergencies.map(array => {
    const newArray = Array.apply(null, Array(82)).map(Number.prototype.valueOf, 0);
    array.forEach((field, index) => {
      if (index === 0)
        newArray[0] = field;
      else if (columnNames.findIndex(c => c === field) !== -1)
        newArray[columnNames.findIndex(c => c === field)] = 1;
    });
    return newArray;
  });

};

//Min alt: 1, Max alt: 4150, Min pre:0.5, Max pre: 865.8, Min temp 4.4, Max temp 30.9
const findMaxAndMin = (oldData) => {
  const maxVar = (data, index) => {
    let max = 0;
    data.forEach(row => {
      if (max < Number(row[index]))
        max = Number(row[index])
    });
    return max;
  };

  const minVar = (data, index) => {
    let min = Number.MAX_VALUE;
    data.forEach(row => {
      if (min > Number(row[index]))
        min = Number(row[index]);
    });
    return min;
  };
  const maxAlt = maxVar(oldData, 7);
  const minAlt = minVar(oldData, 7);
};

const clearString = (string) => {
  return string.replace('Á', 'A').replace('É', 'E').replace('Í', 'I').replace('Ó', 'O').replace('Ú', 'U').replace('Ñ', 'N').replace('Ü', 'U').replace(/\./g, "").toUpperCase()
};

const equalsNames = (department1, city1, department2, city2) => {
  return clearString(city1).trim() === clearString(city2).trim();
};

const run = async () => {
  await readEmergencies();
  await readTempAndPre();
  await merge();
  emergencies = emergencies.filter(e => e.length > 7);
  // await writeData(emergencies, "./newData/Merge.csv");
  // createCategoricalData(emergencies);
  // await writeData(emergencies, "./newData/CategoricalMerge.csv");
  addIds();
  // await writeData(emergencies, "./newData/MergeWithIDS.csv");
  // await writeData(emergencies, "./newData/CategoricalMergeWithIDS.csv");

  // await writeData(filterByEvent('INCENDIO'), "./newData/CategoricalMergeWithIDS-Fire.csv", ['id', 'Anio', 'Mes', 'Departamento', 'Municipio', 'Incendio', 'Altitud', 'PrecipitacionPromedio', 'TemperaturaPromedio']);
  // await writeData(filterByEvent('INUNDACION'), "./newData/CategoricalMergeWithIDS-Flood.csv", ['id', 'Anio', 'Mes', 'Departamento', 'Municipio', 'Inundacion', 'Altitud', 'PrecipitacionPromedio', 'TemperaturaPromedio']);
  await writeData(filterByEvent('DESLIZAMIENTO'), "./newData/CategoricalMergeWithIDS-Glide.csv", ['id', 'Anio', 'Mes', 'Departamento', 'Municipio', 'Deslizamiento', 'Altitud', 'PrecipitacionPromedio', 'TemperaturaPromedio']);
  // const columnNames = ['id', ...getNamesByIndex(2), ...getNamesByIndex(5), ...getNamesByIndex(6), ...getNamesByIndex(7), ...getNamesByIndex(8)];
  // createMatrix(columnNames);
  // await writeData(matrix, "./newData/Matrix.csv", columnNames);
};

run();