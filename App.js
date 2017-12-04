import React, { Component} from 'react';
import {
  ActivityIndicator,
  Image,
  StatusBar,
  StyleSheet,
  Text,
  RefreshControl,
  Dimensions,
  SectionList,
  View,
  TouchableHighlight
} from 'react-native';
import { ImagePicker, AppLoading } from 'expo';
import * as constants from './constants';

export default class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      posts: [],
      image: null,
      isReady: false,
      refreshing: false,
      uploading: false
    };

    this._loadPosts = this._loadPosts.bind(this);
  }

  componentDidMount() {
    this._loadPosts();
  }

  async uploadImageAsync(uri) {
    let apiUrl = `${ constants.API_BASE_URL }/posts`;
    let fileType = uri[uri.length - 1];

    let formData = new FormData();
    formData.append('photo', {
      uri,
      name: `photo.${fileType}`,
      type: `image/${fileType}`,
    });

    let options = {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'multipart/form-data',
      }
    };

    return fetch(apiUrl, options);
  }

  _loadPosts() {
    this.setState({ refreshing: true });

    fetch(`${ constants.API_BASE_URL }/posts`)
      .then(response => response.json())
      .then(posts => {
        this.setState({
          posts: posts,
          refreshing: false
        })
      }).catch(e => {
        console.error('Error fetching results', e);
      })
  }

  render() {
    if (!this.state.isReady) {
      return (
        <AppLoading
          startAsync={ this._loadPosts }
          onFinish={() => this.setState({ isReady: true })}
          onError={ console.warn } />
      );
    }

    return (
      <View style={{ flex: 1, backgroundColor: '#fff' }}>
        <SectionList
          style={{ paddingTop: 35 }}
          renderSectionHeader={() => {
            return (
              <View style={{ flex:1, alignItems: 'center'}}>
                <Image source={ require('./assets/coda-logo.png') } style={{ width: 158, height: 70 }} />
              </View>
            );
          }}
          renderSectionFooter={() => {
            return (
              <View style={{ flex:1, alignItems: 'center', paddingTop: 35 }}></View>
            );
          }}
          sections={[
            { data: this.state.posts, key: 'posts' }
          ]}
          data={ this.state.posts }
          refreshControl={
            <RefreshControl
              refreshing={ this.state.refreshing }
              onRefresh={ this._loadPosts } />
          }
          renderItem={({item}) => {
            if (!item) return <Text>No posts</Text>;

            return <Image
                    source={{ uri: item.location }}
                    style={{ width: Dimensions.get('window').width,
                              height: Dimensions.get('window').width,
                              marginTop: 4 }} />
          }}
        />
        <View style={{ alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent', position: 'absolute', bottom: 70, right: 15 }}>
          <TouchableHighlight
            underlayColor="transparent"
            onPress={ this._takePhoto  }>
            <Image source={ require('./assets/camera.png') } style={{ width: 50, height: 50, marginTop: 15 }} />
          </TouchableHighlight>

          <TouchableHighlight
            underlayColor="transparent"
            onPress={ this._pickImage  }>
            <Image source={ require('./assets/photos.png' )} style={{ width: 50, height: 50, marginTop: 15 }} />
          </TouchableHighlight>
        </View>

        {this._renderUploadingOverlay()}

        <StatusBar barStyle="default" />
      </View>
    );
  }

  _renderUploadingOverlay = () => {
    if (this.state.uploading) {
      return (
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: 'rgba(0,0,0,0.4)',
              alignItems: 'center',
              justifyContent: 'center',
            },
          ]}>
          <ActivityIndicator color="#fff" animating size="large" />
        </View>
      );
    }
  };

  _takePhoto = async () => {
    let pickerResult = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
    });

    this._handleImagePicked(pickerResult);
  };

  _pickImage = async () => {
    let pickerResult = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
    });

    this._handleImagePicked(pickerResult);
  };

  _handleImagePicked = async pickerResult => {
    let uploadResponse, uploadResult;

    try {
      this.setState({ uploading: true });

      if (!pickerResult.cancelled) {
        uploadResponse = await this.uploadImageAsync(pickerResult.uri);
        uploadResult = await uploadResponse.json();
        this.setState({ image: uploadResult.location });
        this._loadPosts();
      }
    } catch (e) {
      console.log({ uploadResponse }, { uploadResult }, { e });
      alert('Upload failed');
    } finally {
      this.setState({ uploading: false });
    }
  };
}
