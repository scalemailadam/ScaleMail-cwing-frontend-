import { gql } from "@apollo/client";

const GET_DOCK = gql`
  query GetDock {
    dock {
      dockItem {
        title
        reactIconName
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
      desktop_folders {
        documentId
        uuid
        title
        modalSlug
        url
        icon {
          url
        }

        items {
          id
          title: Title
          reactIcon
          reactIconColor
          modalSlug
          icon {
            url
          }
          url
          modalSlug
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
export { GET_HEADER, GET_DOCK, GET_FOLDER, GET_BROWSER_MODAL };
