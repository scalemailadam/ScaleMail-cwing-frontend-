import { gql } from "@apollo/client";

const GET_DOCK = gql`
  query GetDock {
    dock {
      dockItem {
        title
        reactIcon
        url
        modalSlug
        reactIconColor
        icon {
          url
        }
      }
    }
  }
`;
const GET_HEADER = gql`
  query GetHeader {
    header {
      logo {
        url
      }
      darkLogo {
        url
      }
      menus {
        label
        items {
          text
          url
          modalSlug
        }
      }
      socialLinks {
        iconName
        url
      }
    }
  }
`;

const GET_FOLDER = gql`
  query FolderCategories {
    folderCategories(sort: "order:asc") {
      documentId
      name
      reactIcon
      reactIconColor
      icon {
        url
      }
      desktop_folders {
        documentId
        title
        modalSlug
        url
        richContent
        backgroundColor
        textColor
        icon {
          url
        }

        items {
          id
          title
          reactIcon
          reactIconColor
          modalSlug
          richContent
          backgroundColor
          textColor
          icon {
            url
          }
          url
          subItem {
            id
            text
            contentItems {
              id
              image {
                url
              }
            }
            modalSlug
            image {
              url
            }
          }
        }
      }
    }
  }
`;
const GET_BROWSER_MODAL = gql`
  query GetBrowserModal {
    browserModal {
      title
      backgroundColor
      textColor
      content {
        __typename
        ... on ComponentSectionsSectionGroup {
          id
          backgroundColor

          ... on ComponentSectionsRichTextSection {
            id
            paragraphText
            backgroundColor
            placementRich: placement
          }
          ... on ComponentSectionsHeadingSection {
            id
            heading
            textSize
            color
            backgroundColor
            placementHeading: placement
          }
          ... on ComponentSectionsImageSection {
            id
            image {
              url
            }
            width
            height
            backgroundColor
            placementImage: placement
          }
          ... on ComponentSectionsGallerySection {
            id
            images {
              url
            }
            columns
            rows
            gap
            backgroundColor
            placementGallery: placement
          }
        }
      }
    }
  }
`;
const GET_PRODUCTS = gql`
  query GetProducts {
    products(sort: "createdAt:desc") {
      documentId
      code
      name
      price
      description
      season
      category
      sizes
      quantity
      images {
        url
      }
      colors {
        name
        hex
        image {
          url
        }
        images {
          url
        }
      }
    }
  }
`;

const GET_PRODUCT = gql`
  query GetProduct($documentId: ID!) {
    product(documentId: $documentId) {
      documentId
      code
      name
      price
      description
      season
      category
      sizes
      quantity
      images {
        url
      }
      colors {
        name
        hex
        image {
          url
        }
        images {
          url
        }
      }
    }
  }
`;

const GET_SYSTEM_SETTINGS = gql`
  query GetSystemSettings {
    systemSettings {
      profileName
      profileSubtitle
      about
      profileImage {
        url
      }
      sidebarItems {
        id
        label
        reactIcon
        slug
      }
      backgroundOptions {
        id
        label
        themeKey
        tipColor
        baseColor
        strokeColor
        previewColor
      }
    }
  }
`;

const GET_STORE_HOME = gql`
  query GetStoreHome {
    storeHome {
      shopImage { url }
      lookbookImage { url }
    }
  }
`;

const GET_LOOKBOOK_PHOTOS = gql`
  query GetLookbookPhotos {
    lookbookPhotos(sort: "order:asc") {
      documentId
      caption
      image {
        url
      }
    }
  }
`;

export { GET_HEADER, GET_DOCK, GET_FOLDER, GET_BROWSER_MODAL, GET_PRODUCTS, GET_PRODUCT, GET_SYSTEM_SETTINGS, GET_LOOKBOOK_PHOTOS, GET_STORE_HOME };
