/**
 * Copyright IBM Corp. 2023
 *
 * This source code is licensed under the Apache-2.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import { ExampleDropContainerApp } from './ExampleDropContainerApp'

function App() {

  return (
    <ExampleDropContainerApp 
      accept={['image/jpeg', 'image/png']} 
      labelText="Drag and drop a file here or click to upload" 
      multiple={false}
    />
  )
}

export default App
